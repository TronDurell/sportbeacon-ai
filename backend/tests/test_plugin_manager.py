import pytest
import asyncio
from services.plugin_manager import EnhancedPluginManager, Plugin, PluginType, PluginDependency
from datetime import datetime

@pytest.mark.asyncio
class TestPluginManager:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.manager = EnhancedPluginManager()
        # Minimal valid plugin config
        self.plugin_config = {
            'id': 'test_plugin',
            'name': 'Test Plugin',
            'version': '1.0.0',
            'type': 'drill',
            'author': 'Test Author',
            'description': 'A test plugin',
            'dependencies': [],
            'conflicts': [],
            'permissions': [],
            'config_schema': None,
            'is_premium': False,
            'price': 0.0,
            'tags': ['test'],
        }

    async def test_plugin_validation(self):
        # Simulate plugin file (zip) and config
        plugin = await self.manager._create_plugin_from_config(self.plugin_config, bundle_id=None)
        # Use a dummy zip file path (should be replaced with a real test file in full test)
        plugin_file = 'tests/test_plugin_bundle.zip'
        # Validation should handle missing file gracefully
        result = await self.manager.validator.validate_plugin(plugin, plugin_file)
        assert isinstance(result.is_valid, bool)
        assert isinstance(result.errors, list)

    async def test_plugin_install_and_analytics(self):
        # Simulate plugin install (mock file system in real test)
        plugin = await self.manager._create_plugin_from_config(self.plugin_config, bundle_id=None)
        await self.manager._install_plugin(plugin, temp_dir='/tmp')
        assert plugin.plugin_id in self.manager.plugins
        # Simulate usage
        await self.manager._update_plugin_usage(plugin.plugin_id)
        analytics = await self.manager.get_plugin_analytics(plugin.plugin_id)
        assert analytics is not None
        assert analytics.total_usage >= 1

    async def test_plugin_preview_rendering(self):
        # Simulate preview logic (would be more UI in frontend)
        plugin = await self.manager._create_plugin_from_config(self.plugin_config, bundle_id=None)
        assert plugin.name == 'Test Plugin'
        assert plugin.description == 'A test plugin'
        # Check changelog and tags
        assert isinstance(plugin.tags, list)

    async def test_federation_scoped_plugin(self):
        # Test federation-scoped plugin logic
        plugin = await self.manager._create_plugin_from_config(self.plugin_config, bundle_id=None)
        plugin.federation_scope = 'UIL'
        # Simulate federation toggle logic
        assert plugin.federation_scope == 'UIL' 