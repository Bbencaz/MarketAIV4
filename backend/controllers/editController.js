import axios from "axios";

export const editImage = async (req, res) => {
  try {
    const { imageBase64, prompt } = req.body;

    if (!imageBase64 || !prompt) {
      return res.status(400).json({ error: "Image and prompt are required." });
    }

    const response = await axios.post(
      `${process.env.COLAB_API_URL}/edit-image`,
      {
        image: imageBase64,
        prompt: prompt,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json({
      editedImage: response.data.edited_image,
    });

  } catch (error) {
    console.error("Error in editImage:", error.response?.data || error.message);

    return res.status(500).json({
      error: "Failed to edit image",
      details: error.response?.data || error.message,
    });
  }
};
