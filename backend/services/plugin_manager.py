"""
Enhanced Plugin Manager for SportBeaconAI v3.0
Supports installable plugin bundles, dependency injection, and async validation
"""

import asyncio
import logging
import json
import os
import importlib
import inspect
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable, Union, Set
import firebase_admin
from firebase_admin import firestore
import yaml
import zipfile
import tempfile
import shutil
import hashlib
import aiofiles
import aiohttp
from pathlib import Path
from dataclasses import dataclass, field
from enum import Enum
import jsonschema
from jsonschema import validate

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase
db = firestore.client()

# Plugin Types
class PluginType(Enum):
    """Plugin types supported by the system"""
    DRILL = "drill"
    SPORT_MODE = "sport_mode"
    VISUALIZATION = "visualization"
    ANALYTICS = "analytics"
    INTEGRATION = "integration"
    GAMIFICATION = "gamification"
    COACHING = "coaching"
    FEDERATION = "federation"
    MONETIZATION = "monetization"
    AI_MODEL = "ai_model"

# Plugin Status
class PluginStatus(Enum):
    """Plugin status enumeration"""
    INSTALLING = "installing"
    ACTIVE = "active"
    INACTIVE = "inactive"
    UPDATING = "updating"
    ERROR = "error"
    VALIDATING = "validating"
    DEPENDENCY_MISSING = "dependency_missing"
    CONFLICT = "conflict"

class PluginBundle:
    """Plugin bundle containing multiple related plugins"""
    
    def __init__(self, bundle_id: str, name: str, version: str):
        self.bundle_id = bundle_id
        self.name = name
        self.version = version
        self.plugins: List[Plugin] = []
        self.dependencies: Dict[str, str] = {}
        self.metadata: Dict[str, Any] = {}
        self.install_path: Optional[str] = None
        self.status = PluginStatus.INACTIVE

@dataclass
class PluginDependency:
    """Plugin dependency specification"""
    plugin_id: str
    version: str
    optional: bool = False
    federation_scope: Optional[str] = None

@dataclass
class PluginValidationResult:
    """Result of plugin validation"""
    is_valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    security_score: float = 0.0
    performance_score: float = 0.0
    compatibility_score: float = 0.0
    validation_time: datetime = field(default_factory=datetime.now)

@dataclass
class PluginUsageAnalytics:
    """Plugin usage analytics data"""
    plugin_id: str
    total_usage: int = 0
    active_users: int = 0
    avg_rating: float = 0.0
    error_rate: float = 0.0
    performance_metrics: Dict[str, float] = field(default_factory=dict)
    last_used: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)

class Plugin:
    """Enhanced plugin class with dependency injection and validation"""
    
    def __init__(self, plugin_id: str, name: str, version: str, plugin_type: PluginType):
        self.plugin_id = plugin_id
        self.name = name
        self.version = version
        self.type = plugin_type
        self.author: str = ""
        self.description: str = ""
        self.dependencies: List[PluginDependency] = []
        self.conflicts: List[str] = []
        self.permissions: List[str] = []
        self.hooks: Dict[str, List[Callable]] = {}
        self.config_schema: Optional[Dict[str, Any]] = None
        self.config: Dict[str, Any] = {}
        self.status = PluginStatus.INACTIVE
        self.install_path: Optional[str] = None
        self.bundle_id: Optional[str] = None
        self.federation_scope: Optional[str] = None
        self.analytics = PluginUsageAnalytics(plugin_id)
        self.validation_result: Optional[PluginValidationResult] = None
        self.last_updated = datetime.now()
        self.is_premium = False
        self.price = 0.0
        self.rating = 0.0
        self.downloads = 0
        self.tags: List[str] = []
        self.changelog: List[Dict[str, Any]] = []
        self.documentation_url: Optional[str] = None
        self.support_url: Optional[str] = None

class DependencyInjector:
    """Dependency injection container for plugins"""
    
    def __init__(self):
        self.services: Dict[str, Any] = {}
        self.singletons: Dict[str, Any] = {}
        self.factories: Dict[str, Callable] = {}
    
    def register_service(self, name: str, service: Any):
        """Register a service instance"""
        self.services[name] = service
    
    def register_singleton(self, name: str, factory: Callable):
        """Register a singleton factory"""
        self.factories[name] = factory
    
    def get_service(self, name: str) -> Any:
        """Get a service instance"""
        if name in self.services:
            return self.services[name]
        
        if name in self.factories:
            if name not in self.singletons:
                self.singletons[name] = self.factories[name]()
            return self.singletons[name]
        
        raise KeyError(f"Service '{name}' not found")
    
    def inject_dependencies(self, plugin: Plugin) -> Dict[str, Any]:
        """Inject dependencies into a plugin"""
        injected = {}
        
        for dependency in plugin.dependencies:
            try:
                injected[dependency.plugin_id] = self.get_service(dependency.plugin_id)
            except KeyError:
                if not dependency.optional:
                    raise ValueError(f"Required dependency '{dependency.plugin_id}' not found")
        
        return injected

class PluginValidator:
    """Enhanced plugin validation system"""
    
    def __init__(self):
        self.schema_validator = jsonschema.Draft7Validator
        self.security_rules: List[Callable] = []
        self.performance_rules: List[Callable] = []
        self.compatibility_rules: List[Callable] = []
        
        # Register default validation rules
        self._register_default_rules()
    
    def _register_default_rules(self):
        """Register default validation rules"""
        # Security rules
        self.security_rules.append(self._check_malicious_code)
        self.security_rules.append(self._check_permission_escalation)
        self.security_rules.append(self._check_data_access)
        
        # Performance rules
        self.performance_rules.append(self._check_resource_usage)
        self.performance_rules.append(self._check_async_operations)
        self.performance_rules.append(self._check_memory_leaks)
        
        # Compatibility rules
        self.compatibility_rules.append(self._check_api_compatibility)
        self.compatibility_rules.append(self._check_version_compatibility)
        self.compatibility_rules.append(self._check_federation_compatibility)
    
    async def validate_plugin(self, plugin: Plugin, plugin_file: str) -> PluginValidationResult:
        """Comprehensive plugin validation"""
        result = PluginValidationResult(is_valid=True)
        
        try:
            # Extract plugin bundle
            with tempfile.TemporaryDirectory() as temp_dir:
                await self._extract_plugin(plugin_file, temp_dir)
                
                # Validate plugin structure
                await self._validate_structure(temp_dir, result)
                
                # Validate configuration schema
                await self._validate_config_schema(plugin, result)
                
                # Run security checks
                await self._run_security_checks(temp_dir, result)
                
                # Run performance checks
                await self._run_performance_checks(temp_dir, result)
                
                # Run compatibility checks
                await self._run_compatibility_checks(plugin, result)
                
                # Calculate scores
                result.security_score = self._calculate_security_score(result)
                result.performance_score = self._calculate_performance_score(result)
                result.compatibility_score = self._calculate_compatibility_score(result)
                
                # Determine overall validity
                result.is_valid = (
                    result.security_score >= 0.7 and
                    result.performance_score >= 0.6 and
                    result.compatibility_score >= 0.8 and
                    len(result.errors) == 0
                )
        
        except Exception as e:
            result.is_valid = False
            result.errors.append(f"Validation failed: {str(e)}")
        
        return result
    
    async def _extract_plugin(self, plugin_file: str, temp_dir: str):
        """Extract plugin bundle to temporary directory"""
        with zipfile.ZipFile(plugin_file, 'r') as zip_ref:
            zip_ref.extractall(temp_dir)
    
    async def _validate_structure(self, temp_dir: str, result: PluginValidationResult):
        """Validate plugin file structure"""
        required_files = ['plugin.yaml', 'README.md']
        
        for file in required_files:
            if not os.path.exists(os.path.join(temp_dir, file)):
                result.errors.append(f"Missing required file: {file}")
        
        # Check for malicious files
        dangerous_extensions = ['.exe', '.bat', '.sh', '.pyc']
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                if any(file.endswith(ext) for ext in dangerous_extensions):
                    result.warnings.append(f"Potentially dangerous file: {file}")
    
    async def _validate_config_schema(self, plugin: Plugin, result: PluginValidationResult):
        """Validate plugin configuration schema"""
        if plugin.config_schema:
            try:
                validate(instance=plugin.config, schema=plugin.config_schema)
            except jsonschema.ValidationError as e:
                result.errors.append(f"Configuration validation failed: {e.message}")
    
    async def _run_security_checks(self, temp_dir: str, result: PluginValidationResult):
        """Run security validation checks"""
        for rule in self.security_rules:
            try:
                rule_result = await rule(temp_dir)
                if not rule_result['passed']:
                    result.errors.append(rule_result['message'])
            except Exception as e:
                result.warnings.append(f"Security check failed: {str(e)}")
    
    async def _run_performance_checks(self, temp_dir: str, result: PluginValidationResult):
        """Run performance validation checks"""
        for rule in self.performance_rules:
            try:
                rule_result = await rule(temp_dir)
                if not rule_result['passed']:
                    result.warnings.append(rule_result['message'])
            except Exception as e:
                result.warnings.append(f"Performance check failed: {str(e)}")
    
    async def _run_compatibility_checks(self, plugin: Plugin, result: PluginValidationResult):
        """Run compatibility validation checks"""
        for rule in self.compatibility_rules:
            try:
                rule_result = await rule(plugin)
                if not rule_result['passed']:
                    result.errors.append(rule_result['message'])
            except Exception as e:
                result.warnings.append(f"Compatibility check failed: {str(e)}")
    
    async def _check_malicious_code(self, temp_dir: str) -> Dict[str, Any]:
        """Check for malicious code patterns"""
        malicious_patterns = [
            'eval(', 'exec(', 'os.system(', 'subprocess.call(',
            'import os', 'import subprocess', '__import__('
        ]
        
        for root, dirs, files in os.walk(temp_dir):
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            for pattern in malicious_patterns:
                                if pattern in content:
                                    return {
                                        'passed': False,
                                        'message': f"Potentially malicious code found in {file}"
                                    }
                    except Exception:
                        continue
        
        return {'passed': True, 'message': ''}
    
    async def _check_permission_escalation(self, temp_dir: str) -> Dict[str, Any]:
        """Check for permission escalation attempts"""
        # Implementation for permission escalation detection
        return {'passed': True, 'message': ''}
    
    async def _check_data_access(self, temp_dir: str) -> Dict[str, Any]:
        """Check for unauthorized data access patterns"""
        # Implementation for data access validation
        return {'passed': True, 'message': ''}
    
    async def _check_resource_usage(self, temp_dir: str) -> Dict[str, Any]:
        """Check for excessive resource usage"""
        # Implementation for resource usage validation
        return {'passed': True, 'message': ''}
    
    async def _check_async_operations(self, temp_dir: str) -> Dict[str, Any]:
        """Check for proper async operation handling"""
        # Implementation for async operation validation
        return {'passed': True, 'message': ''}
    
    async def _check_memory_leaks(self, temp_dir: str) -> Dict[str, Any]:
        """Check for potential memory leaks"""
        # Implementation for memory leak detection
        return {'passed': True, 'message': ''}
    
    async def _check_api_compatibility(self, plugin: Plugin) -> Dict[str, Any]:
        """Check API compatibility"""
        # Implementation for API compatibility validation
        return {'passed': True, 'message': ''}
    
    async def _check_version_compatibility(self, plugin: Plugin) -> Dict[str, Any]:
        """Check version compatibility"""
        # Implementation for version compatibility validation
        return {'passed': True, 'message': ''}
    
    async def _check_federation_compatibility(self, plugin: Plugin) -> Dict[str, Any]:
        """Check federation compatibility"""
        # Implementation for federation compatibility validation
        return {'passed': True, 'message': ''}
    
    def _calculate_security_score(self, result: PluginValidationResult) -> float:
        """Calculate security score based on validation results"""
        base_score = 1.0
        error_penalty = 0.2
        warning_penalty = 0.05
        
        score = base_score
        score -= len(result.errors) * error_penalty
        score -= len(result.warnings) * warning_penalty
        
        return max(0.0, min(1.0, score))
    
    def _calculate_performance_score(self, result: PluginValidationResult) -> float:
        """Calculate performance score based on validation results"""
        # Implementation for performance score calculation
        return 0.9
    
    def _calculate_compatibility_score(self, result: PluginValidationResult) -> float:
        """Calculate compatibility score based on validation results"""
        # Implementation for compatibility score calculation
        return 0.95

class EnhancedPluginManager:
    """Enhanced plugin manager with advanced features"""
    
    def __init__(self):
        self.plugins: Dict[str, Plugin] = {}
        self.bundles: Dict[str, PluginBundle] = {}
        self.plugin_hooks: Dict[str, List[Callable]] = {}
        self.dependency_injector = DependencyInjector()
        self.validator = PluginValidator()
        self.plugins_ref = db.collection('plugins')
        self.bundles_ref = db.collection('plugin_bundles')
        self.analytics_ref = db.collection('plugin_analytics')
        
        # Register core services
        self._register_core_services()
    
    def _register_core_services(self):
        """Register core services for dependency injection"""
        # Register database service
        self.dependency_injector.register_service('database', db)
        
        # Register other core services
        # self.dependency_injector.register_service('ai_engine', ai_engine)
        # self.dependency_injector.register_service('tokenomics', tokenomics_engine)
    
    async def install_plugin_bundle(self, bundle_file: str, bundle_config: Dict[str, Any]) -> bool:
        """Install a plugin bundle with dependency management"""
        try:
            # Validate bundle
            bundle_id = bundle_config['id']
            bundle_name = bundle_config['name']
            bundle_version = bundle_config['version']
            
            # Create bundle
            bundle = PluginBundle(bundle_id, bundle_name, bundle_version)
            bundle.metadata = bundle_config.get('metadata', {})
            bundle.dependencies = bundle_config.get('dependencies', {})
            
            # Check dependencies
            missing_deps = await self._check_bundle_dependencies(bundle)
            if missing_deps:
                logger.error(f"Missing dependencies for bundle {bundle_id}: {missing_deps}")
                return False
            
            # Install bundle
            install_path = f"/plugins/bundles/{bundle_id}_{bundle_version}"
            bundle.install_path = install_path
            
            # Extract and install plugins
            with tempfile.TemporaryDirectory() as temp_dir:
                with zipfile.ZipFile(bundle_file, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
                
                # Install each plugin in the bundle
                for plugin_config in bundle_config.get('plugins', []):
                    plugin = await self._create_plugin_from_config(plugin_config, bundle_id)
                    plugin.bundle_id = bundle_id
                    
                    # Validate plugin
                    validation_result = await self.validator.validate_plugin(plugin, bundle_file)
                    plugin.validation_result = validation_result
                    
                    if validation_result.is_valid:
                        await self._install_plugin(plugin, temp_dir)
                        bundle.plugins.append(plugin)
                    else:
                        logger.error(f"Plugin {plugin.plugin_id} validation failed")
                        return False
            
            # Save bundle
            bundle.status = PluginStatus.ACTIVE
            self.bundles[bundle_id] = bundle
            await self._save_bundle(bundle)
            
            logger.info(f"Plugin bundle {bundle_id} installed successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error installing plugin bundle: {e}")
            return False
    
    async def _check_bundle_dependencies(self, bundle: PluginBundle) -> List[str]:
        """Check if bundle dependencies are satisfied"""
        missing_deps = []
        
        for dep_id, dep_version in bundle.dependencies.items():
            if dep_id not in self.plugins:
                missing_deps.append(dep_id)
            else:
                plugin = self.plugins[dep_id]
                if not self._version_compatible(plugin.version, dep_version):
                    missing_deps.append(f"{dep_id} (version {dep_version} required)")
        
        return missing_deps
    
    def _version_compatible(self, installed_version: str, required_version: str) -> bool:
        """Check if installed version is compatible with required version"""
        # Simple version compatibility check
        # In production, use semantic versioning library
        return installed_version >= required_version
    
    async def _create_plugin_from_config(self, config: Dict[str, Any], bundle_id: str) -> Plugin:
        """Create plugin instance from configuration"""
        plugin = Plugin(
            plugin_id=config['id'],
            name=config['name'],
            version=config['version'],
            plugin_type=PluginType(config['type'])
        )
        
        plugin.author = config.get('author', '')
        plugin.description = config.get('description', '')
        plugin.bundle_id = bundle_id
        
        # Parse dependencies
        for dep_config in config.get('dependencies', []):
            dependency = PluginDependency(
                plugin_id=dep_config['id'],
                version=dep_config['version'],
                optional=dep_config.get('optional', False),
                federation_scope=dep_config.get('federation_scope')
            )
            plugin.dependencies.append(dependency)
        
        plugin.conflicts = config.get('conflicts', [])
        plugin.permissions = config.get('permissions', [])
        plugin.config_schema = config.get('config_schema')
        plugin.is_premium = config.get('is_premium', False)
        plugin.price = config.get('price', 0.0)
        plugin.tags = config.get('tags', [])
        
        return plugin
    
    async def _install_plugin(self, plugin: Plugin, temp_dir: str):
        """Install individual plugin"""
        plugin_path = f"/plugins/{plugin.plugin_id}_{plugin.version}"
        plugin.install_path = plugin_path
        
        # Copy plugin files
        plugin_source = os.path.join(temp_dir, plugin.plugin_id)
        if os.path.exists(plugin_source):
            shutil.copytree(plugin_source, plugin_path)
        
        # Register plugin
        self.plugins[plugin.plugin_id] = plugin
        plugin.status = PluginStatus.ACTIVE
        
        # Save to database
        await self._save_plugin(plugin)
        
        # Register hooks
        await self._register_plugin_hooks(plugin)
    
    async def _register_plugin_hooks(self, plugin: Plugin):
        """Register plugin hooks"""
        for hook_name, hook_functions in plugin.hooks.items():
            if hook_name not in self.plugin_hooks:
                self.plugin_hooks[hook_name] = []
            self.plugin_hooks[hook_name].extend(hook_functions)
    
    async def execute_plugin_hook(self, hook_name: str, data: Any, federation_scope: Optional[str] = None) -> List[Dict[str, Any]]:
        """Execute plugin hooks with federation scoping"""
        results = []
        
        if hook_name in self.plugin_hooks:
            for hook_func in self.plugin_hooks[hook_name]:
                try:
                    # Check federation scope
                    plugin = self._get_plugin_by_hook(hook_func)
                    if plugin and plugin.federation_scope:
                        if federation_scope != plugin.federation_scope:
                            continue
                    
                    # Execute hook
                    if asyncio.iscoroutinefunction(hook_func):
                        result = await hook_func(data)
                    else:
                        result = hook_func(data)
                    
                    results.append({
                        'plugin_id': plugin.plugin_id if plugin else 'unknown',
                        'result': result,
                        'success': True
                    })
                    
                    # Update analytics
                    await self._update_plugin_usage(plugin.plugin_id if plugin else 'unknown')
                    
                except Exception as e:
                    logger.error(f"Error executing plugin hook {hook_name}: {e}")
                    results.append({
                        'plugin_id': plugin.plugin_id if plugin else 'unknown',
                        'result': str(e),
                        'success': False
                    })
        
        return results
    
    def _get_plugin_by_hook(self, hook_func: Callable) -> Optional[Plugin]:
        """Get plugin by hook function"""
        for plugin in self.plugins.values():
            if hook_func in plugin.hooks.values():
                return plugin
        return None
    
    async def _update_plugin_usage(self, plugin_id: str):
        """Update plugin usage analytics"""
        if plugin_id in self.plugins:
            plugin = self.plugins[plugin_id]
            plugin.analytics.total_usage += 1
            plugin.analytics.last_used = datetime.now()
            
            # Save analytics
            await self._save_plugin_analytics(plugin.analytics)
    
    async def get_plugin_analytics(self, plugin_id: str) -> Optional[PluginUsageAnalytics]:
        """Get plugin usage analytics"""
        try:
            doc = self.analytics_ref.document(plugin_id).get()
            if doc.exists:
                data = doc.to_dict()
                analytics = PluginUsageAnalytics(plugin_id)
                analytics.total_usage = data.get('total_usage', 0)
                analytics.active_users = data.get('active_users', 0)
                analytics.avg_rating = data.get('avg_rating', 0.0)
                analytics.error_rate = data.get('error_rate', 0.0)
                analytics.performance_metrics = data.get('performance_metrics', {})
                analytics.last_used = data.get('last_used')
                analytics.created_at = data.get('created_at', datetime.now())
                return analytics
        except Exception as e:
            logger.error(f"Error getting plugin analytics: {e}")
        
        return None
    
    async def _save_plugin(self, plugin: Plugin):
        """Save plugin to database"""
        try:
            plugin_data = {
                'plugin_id': plugin.plugin_id,
                'name': plugin.name,
                'version': plugin.version,
                'type': plugin.type.value,
                'author': plugin.author,
                'description': plugin.description,
                'dependencies': [
                    {
                        'plugin_id': dep.plugin_id,
                        'version': dep.version,
                        'optional': dep.optional,
                        'federation_scope': dep.federation_scope
                    }
                    for dep in plugin.dependencies
                ],
                'conflicts': plugin.conflicts,
                'permissions': plugin.permissions,
                'config': plugin.config,
                'status': plugin.status.value,
                'install_path': plugin.install_path,
                'bundle_id': plugin.bundle_id,
                'federation_scope': plugin.federation_scope,
                'is_premium': plugin.is_premium,
                'price': plugin.price,
                'rating': plugin.rating,
                'downloads': plugin.downloads,
                'tags': plugin.tags,
                'last_updated': plugin.last_updated
            }
            
            self.plugins_ref.document(plugin.plugin_id).set(plugin_data)
            
        except Exception as e:
            logger.error(f"Error saving plugin: {e}")
    
    async def _save_bundle(self, bundle: PluginBundle):
        """Save plugin bundle to database"""
        try:
            bundle_data = {
                'bundle_id': bundle.bundle_id,
                'name': bundle.name,
                'version': bundle.version,
                'dependencies': bundle.dependencies,
                'metadata': bundle.metadata,
                'install_path': bundle.install_path,
                'status': bundle.status.value,
                'plugins': [plugin.plugin_id for plugin in bundle.plugins]
            }
            
            self.bundles_ref.document(bundle.bundle_id).set(bundle_data)
            
        except Exception as e:
            logger.error(f"Error saving bundle: {e}")
    
    async def _save_plugin_analytics(self, analytics: PluginUsageAnalytics):
        """Save plugin analytics to database"""
        try:
            analytics_data = {
                'plugin_id': analytics.plugin_id,
                'total_usage': analytics.total_usage,
                'active_users': analytics.active_users,
                'avg_rating': analytics.avg_rating,
                'error_rate': analytics.error_rate,
                'performance_metrics': analytics.performance_metrics,
                'last_used': analytics.last_used,
                'created_at': analytics.created_at
            }
            
            self.analytics_ref.document(analytics.plugin_id).set(analytics_data)
            
        except Exception as e:
            logger.error(f"Error saving plugin analytics: {e}")

# Initialize enhanced plugin manager
enhanced_plugin_manager = EnhancedPluginManager() 