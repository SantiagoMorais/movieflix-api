import express from "express";
import { PrismaClient } from "@prisma/client";

const app = express();
const port = 3000;
const prisma = new PrismaClient();

app.use(express.json());

app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc",
        },
        include: {
            genres: true,
            languages: true,
        },
    });
    res.json(movies);
});

app.post("/movies", async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } = req.body;

    try {

        const duplicatedTitle = await prisma.movie.findFirst({
            where: {
                title: {
                    equals: title,
                    mode: "insensitive",
                },
            },
        });

        if (duplicatedTitle) {
            res.status(409).send({ message: "There is already a movie with this title registered" });
        }

        await prisma.movie.create({
            data: {
                title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date),
            },
        });
        res.status(201).send();
    } catch (error) {
        res.status(500).send({ message: "Error to create a new movie register" });
    }
});

app.listen(port, () => {
    /* eslint-disable */
    console.log(`Server running on http://localhost:${port}`);
    /* eslint-enable */
});