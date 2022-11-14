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


// // let index = 1;
// designSlide(index);

// function design(n){
//     designSlide(index += n)
// }


// function designSlide(n){
//     let i;
//     let showSlide = document.getElementsByClassName("slide");

//     if (n > showSlide.length){
//         index = 1
//     }

//     if(n < 1){
//         index = showSlide.length;
//     }



    

// for(i=0; i<showSlide.length; i++){
//     showSlide[i].style.display="none";

// }

// showSlide[index-1].style.display = "block";


// }



const next = document.getElementById("btn9");
const prev = document.getElementById("btn8")
const  displaySlide = document.getElementsByClassName("slide");

let index =1; 


next.addEventListener("click", function(){
    if(index < displaySlide.length){
        index++;
       
       
    }else{
        index=displaySlide.length
      
    }
    for(i=0; i<displaySlide.length; i++){
        displaySlide[i].style.display="none";
        
    
    }
    
    displaySlide[index-1].style.display = "block";


// next.classList.add("disabled")
   
    // if(next.click){
    //     prev.classList.add("disabled")
    // }
  

  
   


   
    
    
})

prev.addEventListener("click", function(){
    if(index!=0){
        index--;
       
   
    }else{
        index=0
       
        
    }
    for(i=0; i<displaySlide.length; i++){
        displaySlide[i].style.display="none";
     
       
     
    
    }
    
    displaySlide[index].style.display = "block";

    // if(prev.click){
    //     next.classList.add("disabled") 
    // }
  
   
})



