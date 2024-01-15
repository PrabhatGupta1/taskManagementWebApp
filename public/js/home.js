var totalTasks = document.getElementsByClassName("complete");

for(var i=0;i<totalTasks.length;i++) {
    totalTasks[i].addEventListener("click",function (e) { 
        console.log(e);
        this.parentElement.parentElement.classList.toggle("cross");
        postCompletion(e);
    });    
}

async function postCompletion(e) {
    console.log(e.target.checked);
    console.log(e.target.name);
    const taskStatus = {
        task_id : e.target.name,
        is_completed : e.target.checked,
        taskType : e.target.baseURI 
    }
    
    try {
        const response = await fetch('http://localhost:3000/update/taskstatus', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskStatus),
        });

        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}