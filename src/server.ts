import express from "express";

const app = express();
const port = 3000;

app.get("/movies", (req, res) => {
    res.send("Movies List");
});

app.listen(port, () => {
    /* eslint-disable */
    console.log(`Server running on http://localhost:${port}`);
    /* eslint-enable */
});