const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const s3 = new AWS.S3({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudfront = new AWS.CloudFront();

async function setupMediaInfrastructure() {
    const bucketName = process.env.S3_BUCKET_NAME || 'sportsbeacon-media-bucket';

    try {
        // 1. Create S3 Bucket
        console.log(`Creating S3 bucket: ${bucketName}`);
        await s3.createBucket({
            Bucket: bucketName,
            ACL: 'private'
        }).promise();

        // 2. Enable website hosting
        console.log('Enabling website hosting...');
        await s3.putBucketWebsite({
            Bucket: bucketName,
            WebsiteConfiguration: {
                IndexDocument: { Suffix: 'index.html' },
                ErrorDocument: { Key: 'error.html' }
            }
        }).promise();

        // 3. Apply bucket policy
        console.log('Applying bucket policy...');
        const policyDocument = {
            Version: '2012-10-17',
            Statement: [{
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource: `arn:aws:s3:::${bucketName}/*`
            }]
        };

        await s3.putBucketPolicy({
            Bucket: bucketName,
            Policy: JSON.stringify(policyDocument)
        }).promise();

        // 4. Create CloudFront distribution
        console.log('Creating CloudFront distribution...');
        const distributionConfig = {
            DistributionConfig: {
                CallerReference: Date.now().toString(),
                DefaultRootObject: 'index.html',
                Origins: {
                    Quantity: 1,
                    Items: [{
                        Id: 'S3Origin',
                        DomainName: `${bucketName}.s3.amazonaws.com`,
                        S3OriginConfig: {
                            OriginAccessIdentity: ''
                        }
                    }]
                },
                DefaultCacheBehavior: {
                    TargetOriginId: 'S3Origin',
                    ForwardedValues: {
                        QueryString: false,
                        Cookies: { Forward: 'none' }
                    },
                    TrustedSigners: {
                        Enabled: false,
                        Quantity: 0
                    },
                    ViewerProtocolPolicy: 'redirect-to-https',
                    MinTTL: 0
                },
                Comment: 'SportBeacon Media Distribution',
                Enabled: true
            }
        };

        const distribution = await cloudfront.createDistribution(distributionConfig).promise();
        
        // 5. Create folders structure
        console.log('Creating folder structure...');
        const folders = ['videos', 'images', 'drills', 'thumbnails'];
        for (const folder of folders) {
            await s3.putObject({
                Bucket: bucketName,
                Key: `${folder}/`,
                Body: ''
            }).promise();
        }

        // 6. Update .env file with CloudFront URL
        const envPath = path.join(__dirname, '..', '.env');
        const cdnDomain = distribution.Distribution.DomainName;
        const envContent = `
# Added by setup script
MEDIA_CDN_BASE=https://${cdnDomain}
CLOUDFRONT_DISTRIBUTION_ID=${distribution.Distribution.Id}
`;

        fs.appendFileSync(envPath, envContent);

        console.log('Setup completed successfully!');
        console.log(`CloudFront Domain: https://${cdnDomain}`);
        console.log(`Distribution ID: ${distribution.Distribution.Id}`);

    } catch (error) {
        console.error('Error during setup:', error);
        process.exit(1);
    }
}

// Run setup
setupMediaInfrastructure().catch(console.error); 