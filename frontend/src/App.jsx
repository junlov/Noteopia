import React from 'react'
import Note from './components/Notes/Note'
import { useState, useEffect, useRef } from 'react'
import noteService from './services/notes'
import Notification from './components/Notification/Notification'
import loginService from './services/login'
import LoginForm from './components/Login/LoginForm'
import Togglable from './components/Toggle/Togglable'
import NoteForm from './components/Notes/NoteForm'

const App = ({ props }) => {
  const [notes, setNotes] = useState([])
  const [showAll, setShowAll] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState(null)
  const [loginVisible, setLoginVisible] = useState(false)
  const noteFormRef = useRef()

  //
  //
  // * Login Section
  //
  //
  useEffect(() => {
    const loggedUserJSON = window.localStorage.getItem('loggedNoteappUser')
    if (loggedUserJSON) {
      const user = JSON.parse(loggedUserJSON)
      setUser(user)
      noteService.setToken(user.token)
    }
  }, [])

  const handleLogin = async (event) => {
    event.preventDefault()
    try {
      const user = await loginService.login({ username, password })
      window.localStorage.setItem('loggedNoteappUser', JSON.stringify(user))
      console.log(window.localStorage)
      noteService.setToken(user.token)
      setUser(user)
      setUsername('')
      setPassword('')
    } catch (exception) {
      setErrorMessage('Wrong Credentials')
      setTimeout(() => {
        setErrorMessage(null)
      }, 5000)
    }
  }

  const loginForm = () => {
    const hideWhenVisible = { display: loginVisible ? 'none' : '' }
    const showWhenVisible = { display: loginVisible ? '' : 'none' }

    return (
      <div>
        <div style={hideWhenVisible}>
          <button onClick={() => setLoginVisible(true)} id="login-button1">
            Log in
          </button>
        </div>
        <div style={showWhenVisible}>
          <LoginForm
            username={username}
            password={password}
            handleUsernameChange={({ target }) => setUsername(target.value)}
            handlePasswordChange={({ target }) => setPassword(target.value)}
            handleSubmit={handleLogin}
          />
          <button onClick={() => setLoginVisible(false)}>cancel</button>
        </div>
      </div>
    )
  }

  //
  //
  // * Note Service Section
  //
  //
  useEffect(() => {
    noteService.getAll().then((initialNotes) => setNotes(initialNotes))
  }, [])

  const toggleImportanceOf = (id) => {
    const note = notes.find((n) => n.id === id)
    const changedNote = { ...note, important: !note.important }

    noteService
      .update(id, changedNote)
      .then((returnedNote) => {
        setNotes(notes.map((note) => (note.id !== id ? note : returnedNote)))
      })
      .catch((error) => {
        setErrorMessage(
          `Note '${note.content}' was already removed from server`
        )
        setTimeout(() => {
          setErrorMessage(null)
        }, 5000)
        setNotes(notes.filter((n) => n.id !== id))
      })
  }

  const addNote = (noteObject) => {
    noteFormRef.current.toggleVisibility()
    noteService.create(noteObject).then((returnedNote) => {
      setNotes(notes.concat(returnedNote))
    })
  }

  const noteForm = () => (
    <Togglable buttonLabel="new note" ref={noteFormRef}>
      <NoteForm createNote={addNote} />
    </Togglable>
  )

  const notesToShow = showAll ? notes : notes.filter((note) => note.important)

  return (
    <div className="container">
      <header className="header">
        <h1 className="header__title">
          Note-
          <span className="header__colorful">o</span>
          -pia
        </h1>

        <h2 className="header__secondary-title">
          Welcome to Notepia - where all notes live in peace!
        </h2>
      </header>

      <Notification message={errorMessage} />

      {!user && loginForm()}

      {user && (
        <div>
          <p>{user.name} logged in</p>{' '}
          <button
            onClick={() => {
              window.localStorage.removeItem('loggedNoteappUser')
              setUser(null)
            }}
          >
            Logout
          </button>
          {noteForm()}
        </div>
      )}

      <h2>Notes</h2>

      <button onClick={() => setShowAll(!showAll)}>
        show {showAll ? 'important' : 'all'}
      </button>
      <ul>
        {notesToShow.map((note) => (
          <Note
            key={note.id}
            note={note}
            toggleImportance={() => toggleImportanceOf(note.id)}
          />
        ))}
      </ul>
    </div>
  )
}

export default App
