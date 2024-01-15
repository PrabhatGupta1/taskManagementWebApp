import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = process.env.SERVER_PORT;

const db = new pg.Client({
    user: process.env.USER,
    host: process.env.LOCALHOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT
});

db.connect();
let d = new Date();
let day = d.toUTCString().slice(0,17);
let isPast = false;

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static("public"));

//Method to fetch today tasks
async function getTodayTasks(todayDate) {
    const result = await db.query(
        "SELECT id,task,is_completed FROM today_tasks WHERE t_date = $1 ORDER BY id",
        [todayDate]
    );
    let todayTasks = result.rows;
    return todayTasks;
}

//Method to fetch work tasks
async function getWorkTasks() {
    const result = await db.query("SELECT id,task,is_completed FROM work ORDER BY id");
    let workTasks = result.rows;
    return workTasks;
}

app.get("/", async(req,res)=> {
    try {
        const todayTasks = await getTodayTasks(d);
        res.render("index.ejs",{tasks:todayTasks , currentDay : day,isPast: isPast});
    } catch (error) {
        console.log(error);
        res.send("Error loading today tasks");
    }
});

app.get("/today", async(req,res)=> {
    let oneDay = 24*60*60*1000;
    d = new Date();
    day = d.toUTCString().slice(0,17);
    if(d.getTime()-(new Date()).getTime() < -oneDay) {
        isPast = true;
    } else {
        isPast = false;
    }
    res.redirect("/");
});

app.get("/work", async(req,res)=> {
    try {
        const workTasks = await getWorkTasks();
        res.render("work.ejs",{tasks:workTasks});
    } catch (error) {
        console.log(error);
        res.send("Error loading work tasks");
    }
});

app.post("/create-task", async (req,res) => {
    const newTask = req.body["task"];
    try {
        await db.query(
            "INSERT INTO today_tasks (task, is_completed, t_date) VALUES ($1, $2, $3)",
            [newTask,false,d]
        );
        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.send("Error occured adding the task");
    }
});

app.post("/work", async(req,res) => {
    const task = req.body["task"];
    try {
        await db.query(
            "INSERT INTO work (task,is_completed) VALUES ($1,$2)",
            [task,false]
        );
        res.redirect("/work");
    } catch (error) {
        console.log(error);
        res.send("Error adding the task");
    }
});

app.post("/removeTodayList", async(req,res)=> {
    try {
        await db.query(
            "DELETE FROM today_tasks WHERE t_date = $1",
            [d]
        );
        res.redirect("/");
    } catch (error) {
        console.log(error);
        res.send("Error removing today list");
    }
});

app.post("/removeWorkList",async(req,res)=> {
    try {
        await db.query("DELETE FROM work");
        res.redirect("/work");
    } catch (error) {
        console.log(error);
        res.send("Error occured while removing work list");
    }
});

app.get("/prev", async(req,res)=> {
    let oneDay = 24*60*60*1000;
    d = new Date(d.getTime()-oneDay);
    day = d.toUTCString().slice(0,17);
    if(d.getTime()-(new Date()).getTime() < -oneDay) {
        isPast = true;
    } else {
        isPast = false;
    }
    res.redirect("/");
});

app.get("/next", async(req,res)=> {
    let oneDay = 24*60*60*1000;
    d = new Date(d.getTime()+oneDay);
    day = d.toUTCString().slice(0,17);
    if(d.getTime()-(new Date()).getTime() < -oneDay) {
        isPast = true;
    } else {
        isPast = false;
    }
    res.redirect("/");
});

app.post("/update/taskstatus", async (req,res)=> {
    const {task_id,is_completed,taskType} = req.body;
    let tableToUpdate = "today_tasks";
    let endpointToRedirect = "/";
    if(taskType === 'http://localhost:3000/work') {
        tableToUpdate = "work";
        endpointToRedirect = "/work"
    }
    try {
        await db.query(
            "UPDATE "+tableToUpdate+" SET is_completed = $1 WHERE id = $2",
            [is_completed,task_id]
        );
        res.redirect(endpointToRedirect);
    } catch (error) {
        console.error(error);
        res.send("Internal Server Error");
    }
});

app.listen(port,()=> {
    console.log(`Server started at port ${port}.`);
});