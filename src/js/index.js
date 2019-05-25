
import Search from './models/Search' ;
import Recipe from './models/Recipe' ; 
import List from './models/List' ; 
import Likes from './models/likes' ; 
import * as searchView from './views/searchView' ; 
import * as recipeView from './views/recipeView' ; 
import * as listView from './views/listView' ;
import * as likesView from './views/likesView' ;
import { elements , renderLoader  , clearLoader} from './views/base' ; 

/**  Global State of the app
 *  -- Search Object
 *  -- Current Recipe Object
 *  -- Shopping List Object
 *  -- Liked Recipes
 */

const state = {} ;      

/** 
 * Search Controller
 */
const controlSearch = async() => {
    // 1) Get Query from   View 
      const query = searchView.getInput() ;
 
    
    if (query) {
    // 2) New Search Object and Add to State 
        state.search = new Search(query) ; 

    // 3) Prepare UI for results 
       searchView.clearInput() ; 
       searchView.clearResults() ; 
       renderLoader(elements.searchRes); 

     try {
        
        // 4) Search for Recipes
       await state.search.getResults() ; 

       // 5 ) Render Results on UI 
          clearLoader() ; 
          searchView.renderResults(state.search.result); 

     } catch (err) {
        alert ('Something went wrong with the search controller') ;  
        clearLoader() ; 
     }

    }
}

elements.searchForm.addEventListener('submit' , e => {
        e.preventDefault() ; 
        controlSearch() ; 
}) ; 

elements.searchResPages.addEventListener('click' , e => {
    const btn = e.target.closest('.btn-inline') ; 
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto , 10 ) ;
        searchView.clearResults() ; 
        searchView.renderResults(state.search.result , goToPage); 
    }
}) ; 

/** 
 * Recipe Controller
 */
const controlRecipe = async () => {
    const id = window.location.hash.replace('#','') ; 


            // Get ID from URL 
        if (id) {
            // Prepare UI for Changes 
            recipeView.clearRecipe() ; 
            renderLoader(elements.recipe) ; 

            // HighLight Seleceted search Item 
           if(state.search) searchView.highlightSelected(id) ; 


            // Create new recipe object  
            state.recipe = new Recipe(id) ; 

            try {

            // get recipe data and parse ingredients 
            await state.recipe.getRecipe() ;     
            state.recipe.parseIngredients() ;

            // Calculate Servings and Time 
            state.recipe.calcTime() ; 
            state.recipe.calcServings() ; 

            // Render Recipe 
            clearLoader() ; 
            recipeView.renderRecipe(
                state.recipe,
                state.likes.isLiked(id) 
                ) ; 
            } catch (err) {
                console.log(err) ;
                alert ('Error Processing Recipe') ; 
            }
        } 
} ; 


['hashchange','load'].forEach(event => window.addEventListener(event , controlRecipe) ) ; 


/** 
 * List Controller
 */
 
 const controlList = () => {
     // Create a new list if there is none yet 
     if (!state.list) state.list  = new List() ; 

     // add each ingredient to the list and UI 
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count , el.unit , el.ingredient) ; 
        listView.renderItem(item) ; 
    }) ; 

 }

// Handle delete and update list item events 
elements.shopping.addEventListener('click' , e => {
    const id = e.target.closest('.shopping__item').dataset.itemid ; 

    // Handle the delete button 
    if (e.target.matches('.shopping__delete , .shopping__delete *')) {
        // Delete from state 
        state.list.deleteItem(id) ; 

        // Delete from UI 
        listView.deleteItem(id) ; 


    // Handle the count update 
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value , 10) ; 
        state.list.updateCount(id , val) ;   
    }

}) ; 


/** 
 * Like Controller
 */


const controlLike = () => {
    if (!state.likes) state.likes = new Likes() ; 
    const currentID = state.recipe.id ;

    // user has NOT  yet liked current recipe 
    if (!state.likes.isLiked(currentID)) {
        // Add Like to the state 
        const newLike = state.likes.addLike(
            currentID ,
            state.recipe.title,
            state.recipe.author, 
            state.recipe.img
        ) ; 
        // Toggle the like button 

        likesView.toggleLikeBtn(true) ; 

        // Add Like to the UI list 
        likesView.renderLike(newLike) ;
      



    // user HAS liked current recipe 
    } else {
        // Remove Like from the state 
        state.likes.deleteLike(currentID) ; 

        // Toggle the like button 
        likesView.toggleLikeBtn(false) ; 

        // Remove Like from the UI list 
        likesView.deleteLike(currentID) ;

    }

    likesView.toggleLikeMenu(state.likes.getNumLikes()) ; 

} ; 


// Restore Liked Recipes on Page Load 
window.addEventListener('load' , () => {
    state.likes = new Likes() ; 

    // Restore Likes 
    state.likes.readStorage() ; 
    // Toggle like menu button 
    likesView.toggleLikeMenu(state.likes.getNumLikes()) ; 

    // Render the existing likes 
    state.likes.likes.forEach (like => likesView.renderLike(like)) ; 

}) ; 


// Handling Recipe Button Clicks 
elements.recipe.addEventListener('click' , e => {
        if (e.target.matches('.btn-decrease, .btn-decrease *')) {
            // Decrease Button is Clicked 
            if (state.recipe.servings > 1 ) {
                state.recipe.updateServings('dec') ;
                recipeView.updateServingsIngredients(state.recipe) ; 
            }
            
        } else if (e.target.matches('.btn-increase, .btn-increase *')) {
            // Increase Button is Clicked 
            state.recipe.updateServings('inc') ;
            recipeView.updateServingsIngredients(state.recipe) ; 
        } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
            // Add Ingredients to shopping list 
            controlList(); 
        } else if (e.target.matches('.recipe__love, .recipe__love *'))  {
            // Like Controller 
            controlLike() ; 

        }; 
}) ;    

