import dotenv
from langchain_community.tools import BraveSearch

dotenv.load_dotenv()

tool = BraveSearch.from_search_kwargs(search_kwargs={"count": 3})

if __name__ == "__main__":
    print(tool.run("what is current weather"))
