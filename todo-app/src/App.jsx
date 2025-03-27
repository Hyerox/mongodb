// src/App.jsx
import { useState, useEffect } from 'react'
import './app.css'

// Utiliser la variable d'environnement pour l'URL de l'API
// const API_URL = process.env.VITE_API_URL;
// console.log('API_URL:', API_URL)

function App() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    fetch(`/api/tasks`)
      .then((res) => res.json())
      .then((data) => {
        setTasks(data)
      })
  }, [])

  function handleAddTask() {
    if (!newTask) {
      alert('Please enter a task')
      return
    }
    fetch(`/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: newTask, completed: false }),
    })
      .then((res) => res.json())
      .then((task) => {
        setTasks([...tasks, task])
        setNewTask('')
      })
  }

  function handleToggleTask(id) {
    const task = tasks.find((task) => task._id === id)
    fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...task, completed: !task.completed }),
    })
      .then((res) => res.json())
      .then((updatedTask) => {
        console.log('updatedTask:', updatedTask)
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === id
              ? { ...updatedTask, completed: !updatedTask.completed }
              : task
          )
        )
      })
  }

  function handleDeleteTask(id) {
    fetch(`/api/tasks/${id}`, { method: 'DELETE' }).then(() => {
      setTasks(tasks.filter((task) => task._id !== id))
    })
  }

  function renderTasks() {
    return tasks.map((task) => (
      <li key={task._id} className='flex items-center gap-8'>
        <span
          style={{ textDecoration: task.completed ? 'line-through' : 'none' }}
          onClick={() => handleToggleTask(task._id)}
          className='cursor-pointer flex-1'
        >
          {task.title}
        </span>
        <button
          onClick={() => handleDeleteTask(task._id)}
          className='cursor-pointer'
        >
          Delete
        </button>
      </li>
    ))
  }

  return (
    <main className='mw-420 m-auto p-16 flex flex-col gap-16'>
      <div className='p-16 shadow rounded-16'>
        <h1>Todo List</h1>
        <div className='flex items-center'>
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder='New task'
            className='flex-1 p-8'
          />
          <button onClick={handleAddTask} className='p-8 cursor-pointer'>
            Add Task
          </button>
        </div>
      </div>
      {tasks.length > 0 ? (
        <ul className='flex flex-col gap-8 p-16'>{renderTasks()}</ul>
      ) : (
        <p className='p-16'>No tasks yet</p>
      )}
    </main>
  )
}

export default App
