function lınkedınFunction(){
    const low = document.getElementById("low");
    const more = document.getElementById("more");
    const lınkedın =document.getElementById("lınkedIn");


    if(low.style.display === "none"){
        low.style.display="inline";
        
        lınkedın.innerHTML = "Daha Fazla Göster  <i class='fa-solid fa-chevron-down'  style= 'margin-left=10px'></i>";
        more.style.display="none"
    }else{
        low.style.display="none";
        lınkedın.innerHTML="Daha Az Göster <i class='fa-solid fa-chevron-up' style= 'margin-right=10px'></i>"
        more.style.display="inline"
    }
}






const next = document.getElementById("btn9");
const prev = document.getElementById("btn8")
const  displaySlide = document.getElementsByClassName("slide");

let index =1; 


next.addEventListener("click", function(){
    if(index < displaySlide.length){
        index++;
       
        prev.removeAttribute("disabled","")
    }else{
        index=displaySlide.length
        next.setAttribute("disabled","")
       
      
    }
    for(i=0; i<displaySlide.length; i++){
        displaySlide[i].style.display="none";
        
    
    }
    
    displaySlide[index-1].style.display = "block";
    
    
})

prev.addEventListener("click", function(){
    if(index!=0){
        index--;
        next.removeAttribute("disabled","")
        
       
   
    }else{
        index=0
        prev.setAttribute("disabled","")
        
    }
    for(i=0; i<displaySlide.length; i++){
        displaySlide[i].style.display="none";
     
       
     
    
    }
    
    displaySlide[index].style.display = "block";



  
   
})



