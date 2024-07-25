import express from "express";
import { PrismaClient } from "@prisma/client";
import swaggerUI from "swagger-ui-express";
import swaggerDocument from "../swagger.json";

const app = express();
const port = 3000;
const prisma = new PrismaClient();

app.use(express.json());
app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

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

app.put("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);
    const data = { ...req.body };
    data.release_date = data.release_date ? new Date(data.release_date) : undefined;

    const movie = await prisma.movie.findUnique({
        where: {
            id,
        },
    });

    try {
        if (!movie) {
            return res.status(404).send({ message: `ID '${id}' doesn't exist. Please select a valid ID.` });
        }

        await prisma.movie.update({
            where: {
                id,
            },
            data,
        });
        res.status(200).send({message: "movie updated sucessfully"});
    } catch (error) {
        res.status(500).json({ message: "It was not possible to update the movie register" });
    };
});

app.delete("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);
    const movie = await prisma.movie.findUnique({ where: { id } });

    try {
        if (!movie) {
            res.status(404).send({ message: `ID '${id}' doesn't exist. Please, select a valid ID` });
        }

        await prisma.movie.delete({
            where: {
                id,
            },
        });

        res.status(200).send({ message: "Movie deleted sucessfully" });
    } catch (error) {
        res.status(500).json({ message: "It was not possible to delete the movie register" });
    }
});

app.get("/movies/:genreName", async (req, res) => {
    const genreName = req.params.genreName;

    try {
        const validGender = await prisma.genre.findFirst({
            where: {
                name: {
                    mode: "insensitive",
                    equals: genreName,
                },
            },
        });

        if (!validGender) {
            return res.status(404).send({ message: `The gender '${genreName}' doesn't exist.` });
        }

        const moviesFilteredByGenreName = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true,
            },
            where: {
                genres: {
                    name: {
                        mode: "insensitive",
                        equals: genreName,
                    },
                },
            },
        });

        res.status(200).json({ movies: moviesFilteredByGenreName, numberOfMovies: moviesFilteredByGenreName.length });
    } catch (error) {
        res.status(500).send({ message: "It was not possible to show the list of genders" });
    }
});

app.listen(port, () => {
    /* eslint-disable */
    console.log(`Server running on http://localhost:${port}`);
    /* eslint-enable */
});