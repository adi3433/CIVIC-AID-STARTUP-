
import requests

def test_proxy():
    # Simulate fetching an image through our proxy
    url = "http://localhost:5002/api/proxy_image"
    target_image = "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"
    
    try:
        response = requests.get(url, params={"url": target_image}, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content Type: {response.headers.get('content-type')}")
        print(f"Content Length: {len(response.content)} bytes")
        
        if response.status_code == 200 and len(response.content) > 1000:
            print("✅ Proxy test PASSED! Image fetched successfully.")
        else:
            print("❌ Proxy test FAILED or image too small.")
            
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        print("Note: Make sure the flask server is running locally on port 5002.")

if __name__ == "__main__":
    test_proxy()
