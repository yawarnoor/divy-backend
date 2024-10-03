import "dotenv/config";
import axios from "axios";

const searchGoogle = async (query) => {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/customsearch/v1?key=${process.env.CUSTOM_SEARCH_API_KEY}&cx=${process.env.SEARCH_ENGINE_ID}&q=${query}&num=3`
    );

    return response;
  } catch (e) {
    console.log("Error sending request", e);
  }
};

export default searchGoogle;
