function UI() {
    this.btn_start = document.querySelector('.btn-start'),
        this.btn1 = document.querySelector('.btn1'),
    this.btn_start1 = document.querySelector('.btn-start1'),
  this.btn_start2= document.querySelector('.btn-start2'),

    this.closed=document.querySelector("#closed")

}

UI.prototype.errorAler = function (message) {



    var alert = `<div id='linker' class='invalid-feedback ' style="color:red">${message}</div>`


    input = document.querySelector('.inp')

    input.classList += 'form-control is-invalid'

    const dıv = document.querySelector('.denım')
    dıv.insertAdjacentHTML("beforeend", alert)



    setTimeout(() => { document.querySelector('.alert').remove() }, 3000)


}






UI.prototype.successAlert = function (message) {
    var alert = `<div id='linker' class=' valid-feedback' style="color:green">${message}</div>`


    const input = document.querySelector('.inp')
    input.className += 'form-control is-valid';

    const dıv = document.querySelector('.denım')
    dıv.insertAdjacentHTML("beforeend", alert)



    setTimeout(() => { document.querySelector('.alert').remove() }, 3000)

    // setTimeout(()=>{document.querySelector('.alert').add()},3000)

}


UI.prototype.errorPasword = function (message) {
    var alert = `<div id='linkps'  class='invalid-feedback' style="color:red">${message}</div>`


    input = document.querySelector('.inps')

    input.classList += 'form-control is-invalid'


    const dıv1 = document.querySelector('.denps')
    dıv1.insertAdjacentHTML("beforeend", alert)

   
}

UI.prototype.successPasword = function (message) {
    var alert =  `<div id='linkps'  class=' valid-feedback' style="color:green">${message}</div>`;


    input = document.querySelector('.inps');

    input.classList += 'form-control is-valid';


    const dıv1 = document.querySelector('.denps')
    dıv1.insertAdjacentHTML("beforeend", alert)

   
}






const ui = new UI()


ui.btn1.addEventListener('click', function () {

    const password = document.getElementById('floatingPassword').value.length;


    const email = document.getElementById('floatingInput').value;
    var regex = /^[a-zA-Z0-9._-]+@([a-zA-Z0-9.-]+.)+([.])+[a-zA-Z0-9.-]{2,4}$/;
    if (email === '' || regex.test(email) == false) {
        // input.className='form-control is-invalid';
        ui.errorAler('Yanlış veya boş bir mail adresi girdiniz')



    } else if(password==='' || password<=7 || password>=12){
        ui.errorPasword('şifreniz en az 7 karakter en fazla 15 karakter olmak zorunda')
    }

    else {
       

        ui.successAlert('Email adresi geçerli');
        ui.successPasword('şifreniz geçerli');


         ui.btn_start1.classList.add('active')

         ui.btn_start1.classList.remove("btn12")


     ui.btn_start.classList.add('d-none')

   

    
        // // ui.btn_start.remove('div')

    }

  

})



ui.closed.addEventListener("click",function(e){
    ui.btn_start1.classList.add("btn12"),
    ui.btn_start2.classList.remove("btn12"),
     ui.btn_start2.classList.add("active")
    ui.btn_start.classList.add('d-none')

    e.preventDefault()


})

