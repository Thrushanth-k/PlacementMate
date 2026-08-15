const express = require("express");
const cors = require("cors");

const pool = require("./db");

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());
app.use(express.json());


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {

    res.json({
        message: "PlacementMate backend is running"
    });

});


// ==========================================
// COMPANIES
// ==========================================

// GET ALL COMPANIES

app.get("/api/companies", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                id,
                name,
                TO_CHAR(
                    drive_date,
                    'YYYY-MM-DD'
                ) AS drive_date,
                role,
                package,
                location,
                requirements,
                notes,
                status

            FROM companies

            ORDER BY drive_date ASC
        `);


        res.json(result.rows);

    } catch (error) {

        console.error(
            "GET COMPANIES ERROR:",
            error
        );


        res.status(500).json({

            error:
                "Failed to fetch companies",

            details:
                error.message

        });

    }

});


// ADD COMPANY

app.post("/api/companies", async (req, res) => {

    try {

        const {
            name,
            drive_date,
            role,
            package: packageValue,
            location,
            requirements,
            notes,
            status
        } = req.body;


        const result =
            await pool.query(
                `
                INSERT INTO companies
                (
                    name,
                    drive_date,
                    role,
                    package,
                    location,
                    requirements,
                    notes,
                    status
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8
                )

                RETURNING
                    id,
                    name,
                    TO_CHAR(
                        drive_date,
                        'YYYY-MM-DD'
                    ) AS drive_date,
                    role,
                    package,
                    location,
                    requirements,
                    notes,
                    status
                `,
                [
                    name,
                    drive_date || null,
                    role,
                    packageValue,
                    location,
                    requirements,
                    notes,
                    status || "Upcoming"
                ]
            );


        res.status(201).json(
            result.rows[0]
        );


    } catch (error) {

        console.error(
            "ADD COMPANY ERROR:",
            error
        );


        res.status(500).json({

            error:
                "Failed to add company",

            details:
                error.message

        });

    }

});


// UPDATE COMPANY

app.put("/api/companies/:id", async (req, res) => {

    try {

        const id =
            req.params.id;


        const {
            name,
            drive_date,
            role,
            package: packageValue,
            location,
            requirements,
            notes,
            status
        } = req.body;


        console.log(
            "Updating company:",
            id
        );


        const result =
            await pool.query(
                `
                UPDATE companies

                SET
                    name = $1,
                    drive_date = $2,
                    role = $3,
                    package = $4,
                    location = $5,
                    requirements = $6,
                    notes = $7,
                    status = $8

                WHERE id = $9

                RETURNING
                    id,
                    name,
                    TO_CHAR(
                        drive_date,
                        'YYYY-MM-DD'
                    ) AS drive_date,
                    role,
                    package,
                    location,
                    requirements,
                    notes,
                    status
                `,
                [
                    name,
                    drive_date || null,
                    role,
                    packageValue,
                    location,
                    requirements,
                    notes,
                    status,
                    id
                ]
            );


        if (
            result.rows.length === 0
        ) {

            return res.status(404).json({

                error:
                    "Company not found"

            });

        }


        res.json(
            result.rows[0]
        );


    } catch (error) {

        console.error(
            "UPDATE COMPANY ERROR:",
            error
        );


        res.status(500).json({

            error:
                "Failed to update company",

            details:
                error.message

        });

    }

});


// DELETE COMPANY

app.delete("/api/companies/:id", async (req, res) => {

    try {

        const id =
            req.params.id;


        const result =
            await pool.query(
                `
                DELETE FROM companies

                WHERE id = $1

                RETURNING id
                `,
                [id]
            );


        if (
            result.rows.length === 0
        ) {

            return res.status(404).json({

                error:
                    "Company not found"

            });

        }


        res.json({

            message:
                "Company deleted successfully"

        });


    } catch (error) {

        console.error(
            "DELETE COMPANY ERROR:",
            error
        );


        res.status(500).json({

            error:
                "Failed to delete company",

            details:
                error.message

        });

    }

});


// ==========================================
// TASKS
// ==========================================

// GET TASKS

app.get("/api/tasks", async (req, res) => {

    try {

        const result =
            await pool.query(
                `
                SELECT
                    id,
                    name,
                    category,
                    TO_CHAR(
                        due_date,
                        'YYYY-MM-DD'
                    ) AS due_date,
                    priority,
                    notes,
                    completed

                FROM tasks

                ORDER BY due_date ASC
                `
            );


        res.json(
            result.rows
        );


    } catch (error) {

        console.error(
            "GET TASKS ERROR:",
            error
        );


        res.status(500).json({

            error:
                "Failed to fetch tasks",

            details:
                error.message

        });

    }

});


// ADD TASK

app.post("/api/tasks", async (req, res) => {

    try {

        const {
            name,
            category,
            due_date,
            priority,
            notes,
            completed
        } = req.body;


        const result =
            await pool.query(
                `
                INSERT INTO tasks
                (
                    name,
                    category,
                    due_date,
                    priority,
                    notes,
                    completed
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6
                )

                RETURNING
                    id,
                    name,
                    category,
                    TO_CHAR(
                        due_date,
                        'YYYY-MM-DD'
                    ) AS due_date,
                    priority,
                    notes,
                    completed
                `,
                [
                    name,
                    category,
                    due_date || null,
                    priority || "Medium",
                    notes,
                    completed || false
                ]
            );


        res.status(201).json(
            result.rows[0]
        );


    } catch (error) {

        console.error(
            "ADD TASK ERROR:",
            error
        );


        res.status(500).json({

            error:
                "Failed to add task",

            details:
                error.message

        });

    }

});


// UPDATE TASK

app.put("/api/tasks/:id", async (req, res) => {

    try {

        const id =
            req.params.id;


        const {
            name,
            category,
            due_date,
            priority,
            notes,
            completed
        } = req.body;


        const result =
            await pool.query(
                `
                UPDATE tasks

                SET
                    name = $1,
                    category = $2,
                    due_date = $3,
                    priority = $4,
                    notes = $5,
                    completed = $6

                WHERE id = $7

                RETURNING
                    id,
                    name,
                    category,
                    TO_CHAR(
                        due_date,
                        'YYYY-MM-DD'
                    ) AS due_date,
                    priority,
                    notes,
                    completed
                `,
                [
                    name,
                    category,
                    due_date || null,
                    priority,
                    notes,
                    completed,
                    id
                ]
            );


        if (
            result.rows.length === 0
        ) {

            return res.status(404).json({

                error:
                    "Task not found"

            });

        }


        res.json(
            result.rows[0]
        );


    } catch (error) {

        console.error(
            "UPDATE TASK ERROR:",
            error
        );


        res.status(500).json({

            error:
                "Failed to update task",

            details:
                error.message

        });

    }

});


// DELETE TASK

app.delete("/api/tasks/:id", async (req, res) => {

    try {

        const id =
            req.params.id;


        const result =
            await pool.query(
                `
                DELETE FROM tasks

                WHERE id = $1

                RETURNING id
                `,
                [id]
            );


        if (
            result.rows.length === 0
        ) {

            return res.status(404).json({

                error:
                    "Task not found"

            });

        }


        res.json({

            message:
                "Task deleted successfully"

        });


    } catch (error) {

        console.error(
            "DELETE TASK ERROR:",
            error
        );


        res.status(500).json({

            error:
                "Failed to delete task",

            details:
                error.message

        });

    }

});


// ==========================================
// NOTES
// ==========================================

// GET NOTES

app.get("/api/notes", async (req, res) => {

    try {

        const result =
            await pool.query(
                `
                SELECT
                    id,
                    content,
                    updated_at

                FROM notes

                ORDER BY id DESC

                LIMIT 1
                `
            );


        if (
            result.rows.length === 0
        ) {

            return res.json({

                content: ""

            });

        }


        res.json(
            result.rows[0]
        );


    } catch (error) {

        console.error(
            "GET NOTES ERROR:",
            error
        );


        res.status(500).json({

            error:
                "Failed to fetch notes",

            details:
                error.message

        });

    }

});


// SAVE NOTES

app.put("/api/notes", async (req, res) => {

    try {

        const {
            content
        } = req.body;


        const result =
            await pool.query(
                `
                UPDATE notes

                SET
                    content = $1,
                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE id = 1

                RETURNING *
                `,
                [content]
            );


        if (
            result.rows.length === 0
        ) {

            const newNote =
                await pool.query(
                    `
                    INSERT INTO notes
                    (
                        id,
                        content
                    )

                    VALUES
                    (
                        1,
                        $1
                    )

                    RETURNING *
                    `,
                    [content]
                );


            return res.json(
                newNote.rows[0]
            );

        }


        res.json(
            result.rows[0]
        );


    } catch (error) {

        console.error(
            "SAVE NOTES ERROR:",
            error
        );


        res.status(500).json({

            error:
                "Failed to save notes",

            details:
                error.message

        });

    }

});


// ==========================================
// START SERVER
// ==========================================

const PORT = 5000;


// IMPORTANT:
// 0.0.0.0 allows other devices
// on the same Wi-Fi network
// to access the backend.

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "================================="
        );

        console.log(
            "PlacementMate backend is running"
        );

        console.log(
            "Local:"
        );

        console.log(
            "http://localhost:" +
            PORT
        );

        console.log(
            "Network:"
        );

        console.log(
            "http://192.168.29.20:" +
            PORT
        );

        console.log(
            "================================="
        );

    }
);