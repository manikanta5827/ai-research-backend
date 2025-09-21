from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import concurrent.futures
import time
import requests
from newspaper import Article
from ddgs import DDGS

app = FastAPI(title="web scrapper service", version="1.0.0")


class ArticleResponse(BaseModel):
    url: str
    title: Optional[str] = None
    content: Optional[str] = None
    success: bool
    error: Optional[str] = None
    processing_time: float


class SearchRequest(BaseModel):
    topic: str
    max_results: int = 3
    content_length: int = 2000

class SimpleArticle(BaseModel):
    url: str
    title: Optional[str] = None
    content: Optional[str] = None


def search_urls(query: str, max_results: int = 5) -> List[str]:
    try:
        with DDGS() as ddgs:
            results = []
            for result in ddgs.text(query, max_results=max_results):
                results.append(result['href'])
            return results
    except Exception as e:
        print(f"Error searching: {e}")
        return []

def fetch_article_streaming(url: str, max_length: int = 4000) -> ArticleResponse:
    start_time = time.time()
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; FastAPI-Scraper/1.0)'
        }
        
        response = requests.get(url, headers=headers, stream=True, timeout=10)
        response.raise_for_status()
        
        content_chunks = []
        total_length = 0
        max_download_size = max(max_length * 3, 1024 * 100)
        
        for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
            if chunk:
                content_chunks.append(chunk)
                total_length += len(chunk)
                
                if total_length >= max_download_size:
                    break
        
        if not content_chunks:
            raise Exception("No content received from URL")
        
        # check if the response is an error page
        if total_length < 100:
            raise Exception(f"Content too small ({total_length} chars), might be an error page")
        
        html_content = ''.join(content_chunks)

        article = Article(url)
        article.set_html(html_content)
        article.parse()
        
        content = article.text
        if content and len(content) > max_length:
            content = content[:max_length] + "..."
        
        processing_time = time.time() - start_time
        
        return ArticleResponse(
            url=url,
            title=article.title,
            content=content,
            success=True,
            error=None,
            processing_time=processing_time
        )
    except Exception as e:
        processing_time = time.time() - start_time
        
        return ArticleResponse(
            url=url,
            title=None,
            content=None,
            success=False,
            error=str(e),
            processing_time=processing_time
        )

@app.get("/")
async def root():
    return {"message": "Article Scraper API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": time.time()}


@app.post("/search", response_model=List[SimpleArticle])
async def search(request: SearchRequest):

    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    
    if request.max_results > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 results allowed per request")
    
    found_urls = search_urls(request.topic, request.max_results)
    
    if not found_urls:
        return []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_url = {executor.submit(fetch_article_streaming, url, request.content_length): url for url in found_urls}
        
        articles = []
        for future in concurrent.futures.as_completed(future_to_url):
            result = future.result()
            articles.append(result)
    
    url_to_article = {article.url: article for article in articles}
    simple_articles = []
    
    for url in found_urls:
        if url in url_to_article:
            article = url_to_article[url]
            simple_articles.append(SimpleArticle(
                url=article.url,
                title=article.title,
                content=article.content
            ))
    
    return simple_articles


# running the server using uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
