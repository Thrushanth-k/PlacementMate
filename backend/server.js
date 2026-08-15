const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "PlacementMate backend is running"
    });
});

app.get("/api/companies", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM companies ORDER BY drive_date ASC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch companies"
        });
    }
});

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

        const result = await pool.query(
            `INSERT INTO companies
            (name, drive_date, role, package, location, requirements, notes, status)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            RETURNING *`,
            [
                name,
                drive_date,
                role,
                packageValue,
                location,
                requirements,
                notes,
                status || "Upcoming"
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to add company"
        });
    }
});

app.put("/api/companies/:id", async (req, res) => {
    try {
        const { id } = req.params;

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

        const result = await pool.query(
            `UPDATE companies
             SET name=$1,
                 drive_date=$2,
                 role=$3,
                 package=$4,
                 location=$5,
                 requirements=$6,
                 notes=$7,
                 status=$8
             WHERE id=$9
             RETURNING *`,
            [
                name,
                drive_date,
                role,
                packageValue,
                location,
                requirements,
                notes,
                status,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Company not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to update company"
        });
    }
});

app.delete("/api/companies/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM companies WHERE id=$1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Company not found"
            });
        }

        res.json({
            message: "Company deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to delete company"
        });
    }
});

app.get("/api/tasks", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM tasks ORDER BY due_date ASC"
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch tasks"
        });
    }
});

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

        const result = await pool.query(
            `INSERT INTO tasks
            (name, category, due_date, priority, notes, completed)
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *`,
            [
                name,
                category,
                due_date,
                priority || "Medium",
                notes,
                completed ?? false
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to add task"
        });
    }
});

app.put("/api/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            category,
            due_date,
            priority,
            notes,
            completed
        } = req.body;

        const result = await pool.query(
            `UPDATE tasks
             SET name=$1,
                 category=$2,
                 due_date=$3,
                 priority=$4,
                 notes=$5,
                 completed=$6
             WHERE id=$7
             RETURNING *`,
            [
                name,
                category,
                due_date,
                priority,
                notes,
                completed ?? false,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Task not found"
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to update task"
        });
    }
});

app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            "DELETE FROM tasks WHERE id=$1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Task not found"
            });
        }

        res.json({
            message: "Task deleted successfully"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to delete task"
        });
    }
});

app.get("/api/notes", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM notes ORDER BY id DESC LIMIT 1"
        );

        if (result.rows.length === 0) {
            return res.json({
                content: ""
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to fetch notes"
        });
    }
});

app.put("/api/notes", async (req, res) => {
    try {
        const { content } = req.body;

        const result = await pool.query(
            `UPDATE notes
             SET content=$1,
                 updated_at=CURRENT_TIMESTAMP
             WHERE id=1
             RETURNING *`,
            [content]
        );

        if (result.rows.length === 0) {
            const newNote = await pool.query(
                `INSERT INTO notes (id, content)
                 VALUES (1, $1)
                 RETURNING *`,
                [content]
            );

            return res.json(newNote.rows[0]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to save notes"
        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`PlacementMate backend running on port ${PORT}`);
});