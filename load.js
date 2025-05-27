$(function(){
        $("#header-placeholder").load("extra/header.html");
        $("#nav-placeholder").load("extra/navbar.html", function() {
                const currentURL = window.location.href.split('/').pop();
                
                document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                });
                
                switch(currentURL) {
                case 'index.html':
                case '':
                case '#':
                        document.getElementById('home').classList.add('active');
                        break;
                case 'about.html':
                        document.getElementById('about').classList.add('active');
                        break;
                case 'projects.html':
                        document.getElementById('projects').classList.add('active');
                        break;
                case 'egg.html':
                        document.getElementById('egg').classList.add('active');
                        break;
                }
        });
});