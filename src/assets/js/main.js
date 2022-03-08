document.addEventListener('DOMContentLoaded', () => {
    var menuitems = document.querySelectorAll("nav>ul>li");
    menuitems.forEach((item) => {

        var subMenu = item.querySelector("div.sub-menu");
        if (subMenu) {
            item.addEventListener("mouseover", () => {
                subMenu.style.display = "block";
            });

            item.addEventListener("mouseleave", () => {
                subMenu.style.display = "none";
            });

            subMenu.addEventListener("click", () => {
                subMenu.style.display = "none";
            });
        }
    });
});