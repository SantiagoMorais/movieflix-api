# Movieflix API

🧾✍ This is a project using Node.JS | TypeScript | Express.JS | Prisma

![Movieflix API docs on Swagger](/src/assets/imgs/banner.png)

## Sumary

- [Description](#description)
- [Objectives](#objectives)
- [Functionality](#functionality)
  - [List All Movies](#list-all-movies)
  - [Create a Movie](#create-a-movie)
  - [Update a Movie](#update-a-movie)
  - [Delete a Movie](#delete-a-movie)
  - [Filter Movies by Genre](#filter-movies-by-genre)
- [What I Learned](#what-i-learned)
- [Useful Resources](#useful-resources)
- [Author Information](#author-information)

## Description

The Movieflix API is an application developed as a final exercise for the backend module of the "Devquest - Dev em Dobro" course. This API is responsible for managing movies, offering functionalities to list, create, update, and delete movie records.

## Objectives

- Learn and apply backend development concepts using Node.js and Express.
- Use Prisma as an ORM for database interaction.
- Implement a RESTful API with CRUD operations.
- Document the API using Swagger.

## Functionality

This project used Node.JS and Express.JS to manage the routes and to create the API. The Prisma is usefull to help us to check some verifications, as to check if the id of a specific movie is valid, if it exists, and to manage de database from our app.
The database used was PostgreSQL and every movie from there has this specific struture:

- title (varchar/string)
- genre_id (integer/number)
- language_id (integer/number)
- oscar_count (integer/number)
- release_date (string, and type date)

The movies database has two foreign keys with the "genres" and "languages" databases. That way, we can use the id from the genre and language do know the true value from these properties that have this struture:

- id (serial/number)
- name (varchar/string)

To manipulate these data and to return it into a json format to the user of the API, we used node and express to get these data, to update, delete, to post new data or to filter them by genre, for example.

### List Movies (GET)

This route retrieve a list of all movies, including their genres and languages using the HTTP method GET.
It was used the prisma method to find all the data from database. This method works organizing the movies title alphabetically using the property `orderBy` and `asc` that means "ascendent".
The `include` propertie include the other two databases that are foreign keys of movies database. This way is possible to see the genre and language of the movie not by it id, but by its real value

```ts
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
```
Using Thunder Client, this is returned:

Please, ignore the data, they were randonly choosed.

![Movies list returned by the get method using thunder client](/src/assets/imgs/movies-list.png)

### Create Movie (POST)

This route add a new movie to the database with title, genre, language, Oscar count, and release date.
Now we need to receive the body of the request using `req.body`. 

With the `findFirst` method of prisma, it's possible to verify first if the movie that the user is trying to add into the database already exist. Checking if any of the movies from the data base is equal of the title received from the request body, ignoring uppercase or lowercase letters (mode: "insensitive").

If the movie already exist, the user receive a status 409 (conflict) and a message advising the problem.
If it's everything correct, the method create of prisma add a new movie with all the data received from the request body and return to the user the status "created" (201).

```ts
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
```

### Update Movie (PUT)

This route updates the details of an existing movie by its ID. This route requires the id of the movie to be updated. Using the `findUnique` of the prisma, we can check first if the id is correct, returning to the user the code 200 (ok) or 404 (not found) if the id received is not correct.

It's required to fill, at least, one field in the body of the resquest to update the data of the movie, as title, genre, oscar_count, etc.

```ts
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
        res.status(200).send({message: "Movie updated successfully"});
    } catch (error) {
        res.status(500).json({ message: "It was not possible to update the movie register" });
    };
});
```

Using Thunder Client, this is returned:

![Server response by updating a movie data](/src/assets/imgs/update-movie-data.png)

### Delete Movie (DELETE)

In this route it's possible to remove a movie from the database by its ID.
As the PUT method, it's necessary to identify the movie to be deleted by its ID. Finding the movie using the `findUnique` method of prisma, we can identify a movie with the ID equals of the one received from the parameters. Is the ID is not valid or doesn't exist it's returned to the user the status 404 (not found) and a message.
If the ID be correct, the movie is deleted from the database successfully.

```ts
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

        res.status(200).send({ message: "Movie deleted successfully" });
    } catch (error) {
        res.status 500).json({ message: "It was not possible to delete the movie register" });
    }
});
```

### Filter Movies by Genre (GET)

Finally, this route retrieves movies filtered by genre name.
Different from PUT and DELETE method, that requires the ID of the movie, here we need the genre name as a parameter. The `findFirst` prisma method is to check if the genre exist or not. After this verification, it's used the method `findMany` to filter all movies by its genre, where the movie must have de genre equals of the genre received from the parameter with insensitive mode (ignoring uppercase or lowercase letters).

The return is the status 200 (ok) and the list of movies filtered by genre and the number of movies with that genre.

```ts
app.get("/movies/:genreName", async (req, res) => {
    const genreName = req.params.genreName;

    try {
        const validGenre = await prisma.genre.findFirst({
            where: {
                name: {
                    mode: "insensitive",
                    equals: genreName,
                },
            },
        });

        if (!validGenre) {
            return res.status(404).send({ message: `The genre '${genreName}' doesn't exist.` });
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
        res.status(500).send({ message: "It was not possible to show the movies list filtered by genre" });
    }
});
```

Using Thunder Client, this is returned:

![Movies filtered by gender](/src/assets/imgs/movies-filtered-by-gender.png)

## How to run the application

To learn more about the docs it was used the Swagger, that is a tool to create, to document and test APIs. It creates a interface that permits the user to visualize and interact with the API directly by the web browser, to make easy to understand how the API works.

To visualize the docs by Swagger is necessary to run the server with the script into the terminal "npm run dev" that will permit the server to run.

To access the docs you can access the route "http://localhost:3000/docs". The host 3000 is used by default and it is used in this application, but, if you change it, you can access the documentation anyway, just adjust the local host from your URL. You can see the interface like that:

![Movieflix API docs on Swagger](/src/assets/imgs/banner.png)

## What I Learned

To manage and create my own server and to update, delete, create and more about my API was satisfatory, even more to understand how the others APIs work. This is the first path to create my future full stacks applications and understand more how the HTTP requests work, when and for what to use status codes and the functionality of express and the importance of prisma on our applications to comunicate with data bases.

As soon as possible I'll create a full stack application using my own API into a react application.

## Useful Resources

- [Thunder Client](https://www.thunderclient.com/) - A lightweight and versatile REST API client extension for Visual Studio Code, enabling developers to effortlessly test and debug APIs with intuitive interface and great features.

- [Node.js](https://nodejs.org/) - A JavaScript runtime built on Chrome's V8 engine, enabling the development of scalable and high-performance server-side applications. It uses an event-driven, non-blocking I/O model, making it efficient and suitable for real-time applications.

- [Express](https://expressjs.com/) - A minimal and flexible Node.js web application framework that provides a robust set of features for building web and mobile applications. It simplifies routing, middleware integration, and HTTP request handling.

- [TypeScript](https://www.typescriptlang.org): TypeScript enhances JavaScript development with static typing, improved tooling, and better code readability, leading to more robust and maintainable applications.

- [Prisma](https://www.prisma.io/) - An open-source ORM (Object-Relational Mapping) tool that simplifies database management and interaction in Node.js applications. It provides a type-safe query builder, schema migration, and an intuitive data modeling experience.

- [Swagger](https://swagger.io/) - A suite of tools for designing, documenting, and testing APIs. It provides an interactive API documentation interface, allowing developers and users to explore and test API endpoints directly from the browser.

## Author Information

- GitHub - [Felipe Santiago Morais](https://github.com/SantiagoMorais)
- Linkedin - [Felipe Santiago](https://www.linkedin.com/in/felipe-santiago-873025288/)
- Instagram - [@felipe.santiago.morais](https://www.instagram.com/felipe.santiago.morais)
- Email - <a href="mailto:contatofelipesantiago@gmail.com" target="blank">contatofelipesantiago@gmail.com</a>