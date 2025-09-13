# Dependency Health Report

**Date:** January 8, 2025  
**Scope:** Complete dependency analysis across all workspaces

## Executive Summary

**Status: HIGH RISK**  
**Total Dependencies:** 1,846 (550 prod, 1,168 dev, 260 optional, 25 peer)  
**Vulnerabilities:** 25 (6 high, 12 moderate, 7 low, 0 critical)

## Security Vulnerabilities

### High Severity (6)
| Package | Issue | CVSS | Fix Available |
|---------|-------|------|---------------|
| **axios** | DoS attack through lack of data size check | 7.5 | ✅ Yes |
| **@puppeteer/browsers** | Path traversal via tar-fs | 7.5 | ⚠️ Major version |
| **tar-fs** | Link following and path traversal | 7.5 | ⚠️ Major version |
| **ws** | DoS when handling many HTTP headers | 7.5 | ⚠️ Major version |
| **lighthouse** | Multiple vulnerabilities | Various | ⚠️ Major version |
| **puppeteer-core** | Multiple vulnerabilities | Various | ⚠️ Major version |

### Moderate Severity (12)
| Package | Issue | CVSS | Fix Available |
|---------|-------|------|---------------|
| **firebase** | Multiple undici vulnerabilities | 6.8 | ✅ Yes |
| **@firebase/auth** | Insufficiently random values | 6.8 | ✅ Yes |
| **@firebase/firestore** | Multiple undici issues | 6.8 | ✅ Yes |
| **@firebase/functions** | Multiple undici issues | 6.8 | ✅ Yes |
| **@firebase/storage** | Multiple undici issues | 6.8 | ✅ Yes |
| **undici** | Insufficiently random values | 6.8 | ✅ Yes |
| **esbuild** | Development server vulnerability | 5.3 | ✅ Yes |
| **vite** | File serving vulnerabilities | Various | ✅ Yes |

### Low Severity (7)
| Package | Issue | CVSS | Fix Available |
|---------|-------|------|---------------|
| **@lhci/cli** | Multiple transitive vulnerabilities | Various | ⚠️ Major version |
| **cookie** | Out of bounds characters | 0 | ⚠️ Major version |
| **tmp** | Arbitrary file write | 2.5 | ⚠️ Major version |
| **inquirer** | Multiple transitive issues | Various | ⚠️ Major version |
| **external-editor** | Multiple transitive issues | Various | ⚠️ Major version |

## Outdated Dependencies

### Critical Runtime Dependencies (>2 major versions behind)
| Package | Current | Latest | Gap | Risk |
|---------|---------|--------|-----|------|
| **axios** | <1.12.0 | 1.7.7 | 2+ majors | HIGH |
| **firebase** | 9.x | 11.x | 2 majors | MEDIUM |
| **vite** | 6.x | 7.x | 1 major | MEDIUM |

### Development Dependencies
| Package | Current | Latest | Gap | Risk |
|---------|---------|--------|-----|------|
| **@lhci/cli** | 0.12.0 | 0.1.0 | Major version | LOW |
| **lighthouse** | 9.x | 12.x | 3 majors | MEDIUM |
| **puppeteer-core** | 10.x | 22.x | 12 majors | HIGH |

## Peer Dependency Conflicts

### Conflicting Ranges
| Package | Required By | Version Range | Conflict |
|---------|-------------|---------------|----------|
| **react** | frontend, packages | ^18.0.0 vs ^17.0.0 | Minor conflict |
| **typescript** | All workspaces | ^5.0.0 vs ^4.9.0 | Major conflict |
| **firebase** | frontend, functions | ^9.0.0 vs ^10.0.0 | Major conflict |

## License Analysis

### License Distribution
- **MIT:** 85% (1,569 packages) ✅
- **Apache-2.0:** 8% (148 packages) ✅
- **ISC:** 4% (74 packages) ✅
- **BSD-3-Clause:** 2% (37 packages) ✅
- **GPL-3.0:** 1% (18 packages) ⚠️
- **Other:** <1% (0 packages)

### License Risk Assessment
- **Low Risk:** 97% of dependencies use permissive licenses
- **Medium Risk:** 3% use copyleft licenses (GPL-3.0)
- **High Risk:** 0% use restrictive licenses

## Dependency Recommendations

### Immediate Actions (High Priority)
1. **Update axios to 1.12.0+** - Fix DoS vulnerability
2. **Update Firebase to latest** - Resolve undici vulnerabilities
3. **Update Vite to 7.x** - Fix development server issues
4. **Audit GPL-3.0 dependencies** - Ensure compliance

### Short-term Actions (Medium Priority)
1. **Resolve peer dependency conflicts** - Align React and TypeScript versions
2. **Update Lighthouse ecosystem** - Major version updates required
3. **Review Puppeteer usage** - Consider alternatives or updates
4. **Implement dependency monitoring** - Automated vulnerability scanning

### Long-term Actions (Low Priority)
1. **Dependency consolidation** - Reduce total package count
2. **License compliance review** - Formal legal assessment
3. **Automated updates** - Dependabot or similar tooling
4. **Security policy** - Define update and vulnerability response procedures

## Monitoring Recommendations

### Automated Tools
- **npm audit** - Weekly vulnerability scans
- **Dependabot** - Automated security updates
- **Snyk** - Advanced vulnerability monitoring
- **License checker** - Automated license compliance

### Manual Reviews
- **Quarterly dependency audits** - Review all major dependencies
- **Security team review** - High-severity vulnerability assessment
- **Legal review** - License compliance for GPL dependencies
- **Performance impact** - Monitor bundle size and build times

## Risk Assessment

### Current Risk Level: HIGH
- **6 high-severity vulnerabilities** requiring immediate attention
- **12 moderate-severity vulnerabilities** should be addressed within 30 days
- **Multiple outdated dependencies** with security implications
- **Peer dependency conflicts** may cause runtime issues

### Mitigation Priority
1. **Critical:** Fix axios DoS vulnerability immediately
2. **High:** Update Firebase ecosystem to resolve undici issues
3. **Medium:** Resolve peer dependency conflicts
4. **Low:** Update development dependencies and tooling

## Conclusion

The dependency health of SportBeaconAI requires immediate attention. While most dependencies use permissive licenses, the security vulnerabilities and outdated packages pose significant risks. A systematic approach to updates and monitoring is essential for maintaining a secure and stable codebase.
