from typing import Dict, List, Optional, Any, TypedDict, Literal
import aiohttp
import json
import logging
from datetime import datetime
from pathlib import Path
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class MediaService:
    def __init__(self, config: Dict[str, Any]):
        """Initialize the media service with configuration."""
        self.config = config
        self.cdn_base_url = config['cdn_base_url']
        self.media_bucket = config['media_bucket']
        
        # Initialize AWS S3 client
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=config['aws_access_key_id'],
            aws_secret_access_key=config['aws_secret_access_key'],
            region_name=config['aws_region']
        )

        # Media type configurations
        self.media_config = {
            'video': {
                'allowed_formats': ['mp4', 'webm'],
                'max_duration': 60,  # seconds
                'base_path': 'videos/'
            },
            'image': {
                'allowed_formats': ['jpg', 'png', 'webp'],
                'max_size': 2048,  # pixels
                'base_path': 'images/'
            },
            'animation': {
                'allowed_formats': ['gif', 'webp'],
                'max_duration': 10,
                'base_path': 'animations/'
            },
            '3d_model': {
                'allowed_formats': ['glb', 'usdz'],
                'base_path': 'models/'
            }
        }

    async def search_media(
        self,
        media_type: str,
        subject: str,
        tags: List[str]
    ) -> List[Dict[str, Any]]:
        """Search for existing media content in the database."""
        try:
            # Query your media database/index here
            # This is a simplified example
            media_path = f"{self.media_config[media_type]['base_path']}{subject}"
            matching_media = []

            # List objects in S3 with the given prefix
            paginator = self.s3_client.get_paginator('list_objects_v2')
            async for page in paginator.paginate(
                Bucket=self.media_bucket,
                Prefix=media_path
            ):
                if 'Contents' in page:
                    for obj in page['Contents']:
                        # Get object metadata
                        response = self.s3_client.head_object(
                            Bucket=self.media_bucket,
                            Key=obj['Key']
                        )
                        
                        media_tags = json.loads(
                            response.get('Metadata', {}).get('tags', '[]')
                        )
                        
                        # Check if media tags match search tags
                        if any(tag in media_tags for tag in tags):
                            matching_media.append({
                                'type': media_type,
                                'url': f"{self.cdn_base_url}/{obj['Key']}",
                                'caption': response.get('Metadata', {}).get('caption', ''),
                                'thumbnail_url': response.get('Metadata', {}).get('thumbnail_url'),
                                'duration': float(response.get('Metadata', {}).get('duration', 0)),
                                'format': Path(obj['Key']).suffix[1:],
                                'size': {
                                    'width': int(response.get('Metadata', {}).get('width', 0)),
                                    'height': int(response.get('Metadata', {}).get('height', 0))
                                },
                                'tags': media_tags
                            })

            return matching_media

        except Exception as e:
            logger.error(f"Error searching media: {str(e)}")
            return []

    async def generate_media(
        self,
        media_type: str,
        description: str,
        context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Generate new media content using AI services."""
        try:
            if media_type == 'image':
                return await self._generate_image(description, context)
            elif media_type == 'animation':
                return await self._generate_animation(description, context)
            elif media_type == '3d_model':
                return await self._generate_3d_model(description, context)
            
            return None

        except Exception as e:
            logger.error(f"Error generating media: {str(e)}")
            return None

    async def _generate_image(
        self,
        description: str,
        context: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Generate an image using DALL-E or similar service."""
        try:
            # Call DALL-E API to generate image
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.openai.com/v1/images/generations",
                    headers={
                        "Authorization": f"Bearer {self.config['openai_api_key']}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "prompt": description,
                        "n": 1,
                        "size": "1024x1024",
                        "response_format": "url"
                    }
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        image_url = data['data'][0]['url']
                        
                        # Download and store the image
                        return await self._store_generated_media(
                            media_type='image',
                            url=image_url,
                            description=description,
                            context=context
                        )

            return None

        except Exception as e:
            logger.error(f"Error generating image: {str(e)}")
            return None

    async def _store_generated_media(
        self,
        media_type: str,
        url: str,
        description: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Store generated media in S3 and return metadata."""
        try:
            # Download media from URL
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        content = await response.read()
                        
                        # Generate unique filename
                        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                        filename = f"{context.get('player_id')}_{timestamp}"
                        extension = self.media_config[media_type]['allowed_formats'][0]
                        key = f"{self.media_config[media_type]['base_path']}{filename}.{extension}"
                        
                        # Upload to S3
                        self.s3_client.put_object(
                            Bucket=self.media_bucket,
                            Key=key,
                            Body=content,
                            ContentType=f"{media_type}/{extension}",
                            Metadata={
                                'caption': description,
                                'tags': json.dumps(context.get('tags', [])),
                                'player_id': context.get('player_id', ''),
                                'generated': 'true'
                            }
                        )
                        
                        return {
                            'type': media_type,
                            'url': f"{self.cdn_base_url}/{key}",
                            'caption': description,
                            'thumbnail_url': None,
                            'format': extension,
                            'tags': context.get('tags', [])
                        }

            return None

        except Exception as e:
            logger.error(f"Error storing generated media: {str(e)}")
            return None

    # Add methods for other media types (_generate_animation, _generate_3d_model)
    # as they become available through different AI services 