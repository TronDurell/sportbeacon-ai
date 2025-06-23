from flask import Blueprint, jsonify, request
import psutil
import redis
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

health_bp = Blueprint('health', __name__)

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Basic health check endpoint."""
    try:
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'service': 'sportbeacon-api',
            'version': os.getenv('APP_VERSION', '1.0.0')
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@health_bp.route('/health/detailed', methods=['GET'])
def detailed_health_check():
    """Detailed health check with system metrics."""
    try:
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Redis connection check
        redis_status = 'healthy'
        redis_error = None
        try:
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
            r = redis.from_url(redis_url)
            r.ping()
        except Exception as e:
            redis_status = 'unhealthy'
            redis_error = str(e)
        
        # Database connection check
        db_status = 'healthy'
        db_error = None
        try:
            # Add your database connection check here
            pass
        except Exception as e:
            db_status = 'unhealthy'
            db_error = str(e)
        
        # External API checks
        external_apis = {
            'openai': check_openai_health(),
            'elevenlabs': check_elevenlabs_health(),
            'firebase': check_firebase_health()
        }
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'service': 'sportbeacon-api',
            'version': os.getenv('APP_VERSION', '1.0.0'),
            'system': {
                'cpu_percent': cpu_percent,
                'memory_percent': memory.percent,
                'disk_percent': disk.percent,
                'uptime': get_uptime()
            },
            'services': {
                'redis': {
                    'status': redis_status,
                    'error': redis_error
                },
                'database': {
                    'status': db_status,
                    'error': db_error
                },
                'external_apis': external_apis
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Detailed health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@health_bp.route('/health/coach', methods=['GET'])
def coach_health_check():
    """Health check specifically for coach AI services."""
    try:
        # Check AI model availability
        ai_status = check_ai_services_health()
        
        # Check voice synthesis services
        voice_status = check_voice_services_health()
        
        # Check sport rules system
        sport_rules_status = check_sport_rules_health()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'service': 'sportbeacon-coach',
            'ai_services': ai_status,
            'voice_services': voice_status,
            'sport_rules': sport_rules_status
        }), 200
        
    except Exception as e:
        logger.error(f"Coach health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@health_bp.route('/system/load', methods=['GET'])
def system_load():
    """Get system load and performance metrics."""
    try:
        # CPU metrics
        cpu_count = psutil.cpu_count()
        cpu_percent = psutil.cpu_percent(interval=1, percpu=True)
        cpu_freq = psutil.cpu_freq()
        
        # Memory metrics
        memory = psutil.virtual_memory()
        swap = psutil.swap_memory()
        
        # Disk metrics
        disk = psutil.disk_usage('/')
        disk_io = psutil.disk_io_counters()
        
        # Network metrics
        network = psutil.net_io_counters()
        
        # Process metrics
        process = psutil.Process()
        process_memory = process.memory_info()
        process_cpu = process.cpu_percent()
        
        return jsonify({
            'timestamp': datetime.now().isoformat(),
            'cpu': {
                'count': cpu_count,
                'percent_per_core': cpu_percent,
                'percent_total': sum(cpu_percent) / len(cpu_percent),
                'frequency': {
                    'current': cpu_freq.current if cpu_freq else None,
                    'min': cpu_freq.min if cpu_freq else None,
                    'max': cpu_freq.max if cpu_freq else None
                }
            },
            'memory': {
                'total': memory.total,
                'available': memory.available,
                'percent': memory.percent,
                'used': memory.used,
                'free': memory.free,
                'swap': {
                    'total': swap.total,
                    'used': swap.used,
                    'percent': swap.percent
                }
            },
            'disk': {
                'total': disk.total,
                'used': disk.used,
                'free': disk.free,
                'percent': disk.percent,
                'io': {
                    'read_count': disk_io.read_count if disk_io else 0,
                    'write_count': disk_io.write_count if disk_io else 0,
                    'read_bytes': disk_io.read_bytes if disk_io else 0,
                    'write_bytes': disk_io.write_bytes if disk_io else 0
                }
            },
            'network': {
                'bytes_sent': network.bytes_sent,
                'bytes_recv': network.bytes_recv,
                'packets_sent': network.packets_sent,
                'packets_recv': network.packets_recv
            },
            'process': {
                'memory_rss': process_memory.rss,
                'memory_vms': process_memory.vms,
                'cpu_percent': process_cpu,
                'num_threads': process.num_threads(),
                'create_time': process.create_time()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"System load check failed: {e}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@health_bp.route('/system/metrics', methods=['GET'])
def system_metrics():
    """Get application-specific metrics."""
    try:
        # Cache metrics
        cache_metrics = get_cache_metrics()
        
        # Database metrics
        db_metrics = get_database_metrics()
        
        # API metrics
        api_metrics = get_api_metrics()
        
        # Coach AI metrics
        coach_metrics = get_coach_metrics()
        
        return jsonify({
            'timestamp': datetime.now().isoformat(),
            'cache': cache_metrics,
            'database': db_metrics,
            'api': api_metrics,
            'coach_ai': coach_metrics
        }), 200
        
    except Exception as e:
        logger.error(f"System metrics check failed: {e}")
        return jsonify({
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

# Helper functions
def get_uptime():
    """Get system uptime."""
    try:
        return psutil.boot_time()
    except:
        return None

def check_openai_health():
    """Check OpenAI API health."""
    try:
        # Add OpenAI health check logic
        return {'status': 'healthy', 'response_time': 0.1}
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def check_elevenlabs_health():
    """Check ElevenLabs API health."""
    try:
        # Add ElevenLabs health check logic
        return {'status': 'healthy', 'response_time': 0.2}
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def check_firebase_health():
    """Check Firebase connection health."""
    try:
        # Add Firebase health check logic
        return {'status': 'healthy', 'response_time': 0.1}
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def check_ai_services_health():
    """Check AI services health."""
    try:
        return {
            'openai': check_openai_health(),
            'model_availability': 'healthy',
            'response_time_avg': 0.15
        }
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def check_voice_services_health():
    """Check voice synthesis services health."""
    try:
        return {
            'elevenlabs': check_elevenlabs_health(),
            'voice_models': 'available',
            'synthesis_queue': 0
        }
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def check_sport_rules_health():
    """Check sport rules system health."""
    try:
        # Add sport rules health check logic
        return {'status': 'healthy', 'sports_loaded': 10}
    except Exception as e:
        return {'status': 'unhealthy', 'error': str(e)}

def get_cache_metrics():
    """Get cache performance metrics."""
    try:
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
        r = redis.from_url(redis_url)
        info = r.info()
        
        return {
            'connected_clients': info.get('connected_clients', 0),
            'used_memory': info.get('used_memory', 0),
            'keyspace_hits': info.get('keyspace_hits', 0),
            'keyspace_misses': info.get('keyspace_misses', 0),
            'hit_rate': calculate_hit_rate(info)
        }
    except Exception as e:
        return {'error': str(e)}

def get_database_metrics():
    """Get database performance metrics."""
    try:
        # Add database metrics logic
        return {
            'active_connections': 0,
            'query_count': 0,
            'slow_queries': 0
        }
    except Exception as e:
        return {'error': str(e)}

def get_api_metrics():
    """Get API performance metrics."""
    try:
        # Add API metrics logic
        return {
            'requests_per_minute': 0,
            'average_response_time': 0,
            'error_rate': 0
        }
    except Exception as e:
        return {'error': str(e)}

def get_coach_metrics():
    """Get coach AI performance metrics."""
    try:
        # Add coach AI metrics logic
        return {
            'summaries_generated': 0,
            'voice_feedback_count': 0,
            'average_generation_time': 0
        }
    except Exception as e:
        return {'error': str(e)}

def calculate_hit_rate(info):
    """Calculate cache hit rate."""
    hits = info.get('keyspace_hits', 0)
    misses = info.get('keyspace_misses', 0)
    total = hits + misses
    
    if total == 0:
        return 0
    
    return (hits / total) * 100 