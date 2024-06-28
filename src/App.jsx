import { useEffect, useState, useRef } from "react";
import StarRating from "./StarRating";



const average = (arr) =>
  arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

const key = 'd7da42dc'

export default function App() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState([]);
  // const [watched, setWatched] = useState([]);
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [watched, setWatched] = useState(function(){
    const storageItem = localStorage.getItem('watched')
    return storageItem? JSON.parse(storageItem): []
  });

  
  
  useEffect(function(){
  
  const controller = new AbortController()

   async function fetchMovies(){
   try{
    setIsLoading(true) 
    setError("")
    const res = await fetch(`http://www.omdbapi.com/?apikey=${key}&s=${query}`,{signal: controller.signal})
    if(!res.ok) throw new Error("Something Went Wrong.")
    const data = await res.json()
    
    if(data.Responce==='False'){
      throw new Error("Movies not found")
    }
    setMovies(data.Search)
    setError("")
    }
   catch(err){
    console.log(err)

    if(err.name !=='AbortError'){
      setError(err.message)
    }
    
   } finally{
    setIsLoading(false)
   }

   if(query.length<=3){
    setMovies([])
    setError("")
    return
   }

  }
  handleCloseMovie()   
  fetchMovies(); 
  return function(){
    controller.abort()
  }
  
}, [query])


const handleSelectedMovie = (id)=>{
  setSelectedId((prevSelectedId)=> id===prevSelectedId? null: id)
} 

const handleCloseMovie = ()=>{
  setSelectedId(null)
}

const handleAddWatched = (movie)=>{
  setWatched((prev)=> [...prev, movie])
}

//// when we delete the item then it will sync with watched so better way is this.
useEffect(function(){
  localStorage.setItem('watched', JSON.stringify(watched))   //// this tym we do not need call back as this usefect will only run when watched is updated
},[watched])

const handleDeleteWatched = (id)=>{
  setWatched(prev=> prev.filter(movie => movie.imdbID !== id))
}

return (
    <>
     <Navbar movies={movies}> 
      <Logo />
      <Search query={query} setQuery={setQuery}/>
      <Numresults movies={movies} />
      </Navbar> 
     <Main> 
        <Box> 
          {/* {isLoading? <Loader /> :<MoviesList movies={movies}/> } */}
          {isLoading && <Loader />}
          {!isLoading && !error &&  <MoviesList movies={movies} onSelectedMovie={handleSelectedMovie}/> }
          {error && <Error message={error} /> }
          
        </Box>
        <Box>
          {selectedId? <MovieDetails selectedId={selectedId} onCloseMovie={handleCloseMovie}
                               onAddWatched={handleAddWatched} watched={watched}/> :(
            <>
            <WatchedSummary watched={watched} />          
            <WatchedMoviesList watched={watched} onDeleteWatched={handleDeleteWatched}  />
            </>
          )}
        </Box>
     </Main>
    </>
  );
}

function Loader(){
  return (
    <p className="loader">Loading...</p>
  )
}

function Error({message}){
  return(
    <p className="error">
    <span>😡</span><p>{message}</p>
    </p>
  )
}

function Navbar({children}){
  return (
    <nav className="nav-bar"> {children} </nav>
  )
}

function Logo(){
  return (
    <div className="logo">
      <span role="img">🍿</span>
      <h1>usePopcorn</h1>
    </div>
  )
}

function Numresults({movies=[]}){
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  )
}


function Search({query, setQuery}){
  const inputEl = useRef(null)  
  ///// to check current focus element we can use activeElement property, document.activeElement
  useEffect(function(){
    function callback(e){
      if(document.activeElement === inputEl.current) return;
      if(e.code==="Enter"){
        inputEl.current.focus() 
        setQuery("")   ///// for removing the list items,  here problem is that if we are already at the input field then text will deleted
      }
  }
    document.addEventListener('keydown', callback)
    return function(){
    document.removeEventListener('keydown', callback)
    }
    
  },[])
 
  return(
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  )
}

function Main({children}){
  return(
    <main className="main">
    {children}
    </main>
  )
}


function Box({children}){
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="box">
      <button
        className="btn-toggle"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? "–" : "+"}
      </button>
      {isOpen && children}
    </div>
  )
}

function MoviesList({movies, onSelectedMovie}){
  return (
    <ul className="list list-movies">
          {movies?.map((movie) => (
            <Movie movie={movie} key={movie.imdbID} onSelectedMovie={onSelectedMovie}/>
          ))}
    </ul>
  )
}

function Movie({movie, onSelectedMovie}){
  return (
    <li onClick={()=>onSelectedMovie(movie.imdbID)} className="list list-movies">
              <img src={movie.Poster} alt={`${movie.Title} poster`} />
              <h3>{movie.Title}</h3>
              <div>
                <p>
                  <span>🗓</span>
                  <span>{movie.Year}</span>
                </p>
              </div>
    </li>
  )
}

function MovieDetails({selectedId, onCloseMovie, onAddWatched, watched}){
  const [movie, setMovie] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [userRating, setUserRating] = useState("")


  const isWatched = watched.map((movie)=>movie.imdbID).includes(selectedId)
  const watchedMovie = watched.find((movie) => movie.imdbID === selectedId);
  const watchedUserRating = watchedMovie ? watchedMovie.userRating : undefined;
  
  const {Title:title, Year:year, 
         Poster:poster, Runtime:runtime, 
         imdbRating, Plot:plot, 
         Released:released, Actors:actors, 
         Director:director, Genre:genre } = movie

  const handleAdd = ()=>{
    const newWatchedMovie = {
      imdbID: selectedId,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      title,
      year,
      poster,
      userRating,
    }
    onAddWatched(newWatchedMovie)
    onCloseMovie()
  }
  
  useEffect(function(){
    async function getMovieDetails(){
    setIsLoading(true)
    const res = await fetch(`http://www.omdbapi.com/?apikey=${key}&i=${selectedId}`)
    const data = await res.json();
    setMovie(data)
    }
    getMovieDetails()
    setIsLoading(false)
  },[selectedId])

 useEffect(function(){
    if(!title) return      
    document.title=`Movie-${title}`
    return function(){
      document.title='usePopcorn'
      console.log(`clean up effect for movie ${title}`)
    }
  },[title])

  useEffect(function(){
    const callback = (e)=>{
      if(e.code==='Escape'){
        onCloseMovie()
        console.log('clossing')
      }}
    document.addEventListener('keydown', callback)

    return function(){
      document.removeEventListener('keydown', callback)
    }

  },[])

 return (
    <div className="details">
      {isLoading ? <Loader /> : (
        <>
        <header>
        <button className="btn-back" onClick={onCloseMovie}>
          &larr;
        </button>
        <img src={poster} alt={`Poster of ${movie} movie`} />
        <div className="details-overview">
          <h2>{title}</h2>
          <p>
            {released} &bull; {runtime}
          </p>
          <p>{genre}</p>
          <p>
            <span>⭐️</span>
            {imdbRating} IMDb rating
          </p>
        </div>
    </header>

    <section>
      {!isWatched ?  (
        <>
        <StarRating maxRating={10} size={24} onSetRating={setUserRating}/>
        {userRating>0 && <button className="btn-add" onClick={handleAdd}>+ Add to list</button>}
        </>
      ) : (
        <p>You rated this movie {watchedUserRating} <span>⭐</span></p>
        )
    }
        <p>
          <em>{plot}</em>
        </p>
        <p>Starring {actors}</p>
        <p>Directed by {director}</p>
      </section>
      </>
      )}
    </div>
  )
}

function WatchedSummary({watched}){
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
  const avgUserRating = average(watched.map((movie) => movie.userRating));
  const avgRuntime = average(watched.map((movie) => movie.runtime));
  return (
    <div className="summary">
            <h2>Movies you watched</h2>
            <div>
              <p>
                <span>#️⃣</span>
                <span>{watched.length} movies</span>
              </p>
              <p>
                <span>⭐️</span>
                <span>{avgImdbRating.toFixed(2)}</span>
              </p>
              <p>
                <span>🌟</span>
                <span>{avgUserRating.toFixed(2)}</span>
              </p>
              <p>
                <span>⏳</span>
                <span>{avgRuntime.toFixed(2)} min</span>
              </p>
            </div>
          </div>
  )
}

function WatchedMoviesList({watched, onDeleteWatched}){
  return(
    <ul className="list">
        {watched.map((movie) => (
          <WatchedMovie movie={movie} key={movie.imdbID} onDeleteWatched={onDeleteWatched} />
        ))}
    </ul>
  )
}

function WatchedMovie({movie, onDeleteWatched}){
  return(
    <li key={movie.imdbID}>
                <img src={movie.poster} alt={`${movie.title} poster`} />
                <h3>{movie.title}</h3>
                <div>
                  <p>
                    <span>⭐️</span>
                    <span>{movie.imdbRating}</span>
                  </p>
                  <p>
                    <span>🌟</span>
                    <span>{movie.userRating}</span>
                  </p>
                  <p>
                    <span>⏳</span>
                    <span>{movie.runtime} min</span>
                  </p>
                  <button className="btn-delete" onClick={()=>onDeleteWatched(movie.imdbID)}>X</button>
                </div>
              </li>
  )
}