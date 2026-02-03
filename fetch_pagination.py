import urllib.request
import urllib.parse
import json

def fetch_all_data():
    base_url = "https://api.scrunchai.com/v1/2894/query"
    headers = {
        "Authorization": "Bearer 497ceb95ef07eb693b6a8b219f6ee3d02317ef0508fa105685ebca272c9452c2"
    }
    params = {
        "start_date": "2025-12-01",
        "end_date": "2026-01-27",
        "limit": 1000,
        "offset": 0,
        "fields": "responses,prompt,prompt_id"
    }
    
    total_count = 0
    
    while True:
        query_string = urllib.parse.urlencode(params)
        url = f"{base_url}?{query_string}"
        
        print(f"Fetching offset {params['offset']}...")
        req = urllib.request.Request(url, headers=headers)
        
        try:
            with urllib.request.urlopen(req) as response:
                if response.status != 200:
                    print(f"Error: {response.status}")
                    break
                
                data = json.loads(response.read().decode())
                batch_size = len(data)
                total_count += batch_size
                
                print(f"Received {batch_size} items. Total so far: {total_count}")
                
                if batch_size < params['limit']:
                    # No more data to fetch
                    break
                    
                params['offset'] += params['limit']
        except Exception as e:
            print(f"Exception: {e}")
            break
        
    return total_count

if __name__ == "__main__":
    total = fetch_all_data()
    print(f"\nFinal Total Length: {total}")
