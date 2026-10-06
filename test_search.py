import requests

BASE_URL = "http://127.0.0.1:8080/api/products/search/"

def test_endpoint(name, params):
    try:
        response = requests.get(BASE_URL, params=params)
        response.raise_for_status()
        data = response.json()
        print(f"PASS — {name} ({response.url}) -> {data['count']} results")
        return data
    except Exception as e:
        print(f"FAIL — {name} ({params}): {e}")

if __name__ == "__main__":
    print("Executing API Tests...")
    test_endpoint("GET /api/products/search/", {})
    test_endpoint("q=dress", {"q": "dress"})
    test_endpoint("min_price=1000&max_price=5000", {"min_price": 1000, "max_price": 5000})
    test_endpoint("category=Kemis", {"category": "Kemis"})
    test_endpoint("sort=price_asc", {"sort": "price_asc"})
    test_endpoint("sort=price_desc", {"sort": "price_desc"})
    test_endpoint("in_stock=true", {"availability": "in_stock"})
    test_endpoint("q + category", {"q": "dress", "category": "Kemis"})
    test_endpoint("q + price", {"q": "dress", "min_price": 2000, "max_price": 4000})
    test_endpoint("category + price", {"category": "Kemis", "max_price": 6000})
    test_endpoint("category + color", {"category": "Kemis", "color": "white"})
    test_endpoint("category + gender", {"category": "Kemis", "gender": "women"})
    test_endpoint("price + availability", {"max_price": 5000, "availability": "in_stock"})
    test_endpoint("q + category + price + sort", {"q": "white", "category": "Kemis", "max_price": 6000, "sort": "price_asc"})
    test_endpoint("negative price", {"min_price": -100})
    test_endpoint("invalid price", {"min_price": "abc"})
