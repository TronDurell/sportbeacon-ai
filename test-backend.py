#!/usr/bin/env python3
"""
Simple backend validation script
"""
import requests
import json
import time

def test_backend():
    base_url = "http://127.0.0.1:8000"
    
    print("🔍 Testing SportBeacon AI Backend...")
    
    # Test health endpoint
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health endpoint: {data}")
        else:
            print(f"❌ Health endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health endpoint error: {e}")
        return False
    
    # Test API test endpoint
    try:
        response = requests.get(f"{base_url}/api/test", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API test endpoint: {data}")
        else:
            print(f"❌ API test endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API test endpoint error: {e}")
        return False
    
    print("🎉 Backend validation successful!")
    return True

if __name__ == "__main__":
    test_backend()
