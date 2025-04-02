// app.js
import express from 'express'
import dotenv from 'dotenv'
// Ajouter l'import de cors
import cors from 'cors'

import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// MongoDB
import { MongoClient, ObjectId } from 'mongodb'
dotenv.config()

// Ces lignes sont nécessaires avec les modules ES (type: module)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

const PORT = process.env.PORT || 8080

// Ajouter ces middlewares avant les autres
app.use(cors())
app.use(express.json())
// Servir les fichiers statiques de l'application REACT build
app.use(express.static('dist'))
// Middleware pour analyser les corps JSON des requêtes
app.use(express.json())

const client = new MongoClient(process.env.MONGO_URI)

let tasksCollection

async function startServer() {
  try {
    await client.connect()
    tasksCollection = client.db(process.env.MONGO_DB).collection('tasks') // Ajoute .collection("tasks")
    console.log('✅ Connexion MongoDB établie')
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB :', err)
  }
}

startServer() // N'oublie pas d'appeler la fonction

// Logger middleware pour logger chaque requête
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  console.log('↖️  req.body: ')
  console.log(req.body)
  const oldSend = res.send
  res.send = function (data) {
    console.log('↘️ ', `Status: ${res.statusCode}`)
    if (data) console.log(JSON.parse(data))
    oldSend.call(this, data)
  }
  next()
})

// Opérations CRUD

// GET : Récupérer toutes les tâches
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await tasksCollection.find().toArray() // Récupérer tous les documents
    res.json(tasks)
  } catch (error) {
    res.status(500).json({ message: 'Échec de la récupération des tâches.' })
  }
})

// POST : Créer une nouvelle tâche
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, completed } = req.body

    // Validation des données
    if (!title || typeof completed !== 'boolean') {
      return res.status(400).json({ message: 'Invalid task format' })
    }

    const newTask = { title, completed }
    console.log('Received new task:', newTask) // Log pour déboguer

    const result = await tasksCollection.insertOne(newTask) // Insérer un nouveau document
    res.status(201).json({ ...newTask, _id: result.insertedId }) // Répondre avec la tâche créée
  } catch (error) {
    console.error('Erreur lors de la création de la tâche:', error) // Log pour déboguer
    res.status(400).json({ message: 'Échec de la création de la tâche.' })
  }
})

// PUT : Mettre à jour une tâche par ID
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Format d'ID invalide" }) // Valider l'ID
    }

    const objectId = new ObjectId(id)
    const updatedTask = req.body
    delete updatedTask._id // Empêcher le client de changer le _id

    const result = await tasksCollection.findOneAndUpdate(
      { _id: objectId },
      { $set: updatedTask }
    )
    if (result) {
      res.json(result) // Envoie le document mis à jour
    } else {
      res.status(404).json({ message: 'Task not found' })
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    res.status(400).json({ message: error.message })
  }
})

// DELETE : Supprimer une tâche par ID
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Format d'ID invalide" })
    }

    const objectId = new ObjectId(id)
    const result = await tasksCollection.deleteOne({ _id: objectId })
    if (result.deletedCount === 1) {
      res.status(204).send() // Aucun contenu à renvoyer
    } else {
      res.status(404).json({ message: 'Tâche non trouvée' })
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error)
    res.status(400).json({ message: error.message })
  }
})

// Classe abstraite pour les actions sur les tâches
class TaskAction {
  execute(task) {
    throw new Error('Method "execute" must be implemented')
  }
}

// Action pour marquer une tâche comme terminée
class CompleteTaskAction extends TaskAction {
  async execute(task) {
    task.completed = true
    await tasksCollection.updateOne({ _id: task._id }, { $set: task })
    return task
  }
}

// Action pour mettre à jour la priorité d'une tâche
class UpdatePriorityAction extends TaskAction {
  constructor(priority) {
    super()
    this.priority = priority
  }

  async execute(task) {
    task.priority = this.priority
    await tasksCollection.updateOne({ _id: task._id }, { $set: task })
    return task
  }
}

// Endpoint pour exécuter une action sur une tâche
app.post('/api/tasks/:id/action', async (req, res) => {
  try {
    const { id } = req.params
    const { actionType, actionData } = req.body

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Format d'ID invalide" })
    }

    const task = await tasksCollection.findOne({ _id: new ObjectId(id) })
    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' })
    }

    let action
    switch (actionType) {
      case 'complete':
        action = new CompleteTaskAction()
        break
      case 'updatePriority':
        action = new UpdatePriorityAction(actionData.priority)
        break
      default:
        return res.status(400).json({ message: "Type d'action non supporté" })
    }

    const updatedTask = await action.execute(task)
    res.json(updatedTask)
  } catch (error) {
    console.error("Erreur lors de l'exécution de l'action:", error)
    res.status(500).json({ message: 'Erreur interne du serveur' })
  }
})

// Rediriger toutes les autres requêtes vers index.html pour la gestion du routage côté client
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'))
})

// Démarrer le serveur et écouter sur le port configuré

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} via http://localhost:${PORT}`)
})
