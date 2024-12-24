const mobileMenuBtn = document.querySelector(".mobile-menu-button");
const navMenu = document.querySelector(".nav-menu");

mobileMenuBtn.addEventListener("click", () => {
  navMenu.classList.toggle("show");
});
