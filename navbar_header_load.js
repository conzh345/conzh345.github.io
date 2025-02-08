function loadNavbarHeader(){
    document.getElementById("header").innerHTML = 
    <div style="text-align:center; background-image:linear-gradient(#32cd32, #8eda81); padding:50px; position:sticky">
        <h1>Conway Zhou</h1>
    </div>;
    ("#nav-placeholder").load("navbar.html");
    ("#header-placeholder").load("header.html");
  }