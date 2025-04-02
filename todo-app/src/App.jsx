// src/App.jsx
import { useState, useEffect } from 'react'

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
    console.log('Adding new task:', newTask) // Log pour déboguer
    fetch(`/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: newTask, completed: false }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to add task')
        }
        return res.json()
      })
      .then((task) => {
        console.log('Task added successfully:', task) // Log pour déboguer
        setTasks([...tasks, task])
        setNewTask('')
      })
      .catch((error) => {
        console.error('Error adding task:', error) // Log pour déboguer
        alert('Failed to add task. Please try again.')
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

  return (
    <main className='min-h-screen bg-gradient-to-br from-gray-900 via-stone-900 to-green-950 flex items-center justify-center w-screen'>
      <div className='bg-stone-800 shadow-2xl rounded-lg p-8 w-full max-w-md flex flex-col justify-center items-center border border-green-800/30'>
        <h1 className='text-4xl font-bold text-green-100 text-center mb-6'>
          My Tasks
        </h1>
        <div className='flex items-center gap-3 mb-6 w-full'>
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder='Add a new task...'
            className='flex-1 p-4 bg-stone-700 text-green-100 border border-green-800/50 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-800/30 placeholder-green-200/30'
          />
          <button
            onClick={handleAddTask}
            className='bg-gradient-to-r from-green-800 to-emerald-800 text-green-100 px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-shadow shadow-lg hover:shadow-xl hover:shadow-green-900/30'
          >
            Add
          </button>
        </div>
        {tasks.length > 0 ? (
          <ul className='space-y-4 w-full'>
            {tasks.map((task) => (
              <li
                key={task._id}
                className='flex items-center justify-between bg-stone-700/50 p-4 rounded-lg shadow-md hover:shadow-lg transition border border-green-800/20'
              >
                <span
                  onClick={() => handleToggleTask(task._id)}
                  className={`flex-1 cursor-pointer text-lg ${
                    task.completed
                      ? 'line-through text-green-400/50'
                      : 'text-green-100'
                  }`}
                >
                  {task.title}
                </span>
                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className='text-red-400 hover:text-red-300 transition font-bold'
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className='text-center text-green-200/50 text-lg'>No tasks yet</p>
        )}
      </div>
    </main>
  )
}

export default App
