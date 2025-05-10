import { renderLogin } from '../components/Login/Login.js';
import { renderDashboard } from '../components/Dashboard/Dashboard.js';

const mainContainer = document.getElementById('main-container');

function showLogin() {
  renderLogin(mainContainer, showDashboard);
}

function showDashboard() {
  renderDashboard(mainContainer, showLogin);
}

// Initial view
showLogin();

const openSlide = document.querySelector(".slidem");
const closeSlide= document.querySelector(".btn-close");
 openSlide.addEventListener("click", () =>{
    document.querySelector(".job").style.width = "380px"
 })

 closeSlide.addEventListener("click",() =>{
    document.querySelector(".job").style.width = "0"
 })



 