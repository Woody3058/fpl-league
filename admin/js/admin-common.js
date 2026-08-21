
async function requireAdminLogin() {

    console.log(
        "admin-common.js: requireAdminLogin Called"
    );


    const {
        data,
        error
    } =
        await supabaseClient.auth.getSession();


    if (error) {

        console.error(
            "Session error:",
            error
        );

        window.location.href =
            "login.html";

        return false;

    }


    if (!data.session) {

        window.location.href =
            "login.html";

        return false;

    }


    return true;

}


async function logoutAdmin() {

    await supabaseClient.auth.signOut();

    window.location.href =
        "login.html";

}

function setupAdminLogout() {

    const button =
        document.getElementById(
            "logoutButton"
        );


    if (!button)
        return;


    button.addEventListener(
        "click",
        logoutAdmin
    );

}


function setActiveAdminNavigation(
    page
) {

    const links = {

        scores:
            document.getElementById(
                "scoresNavLink"
            ),

        players:
            document.getElementById(
                "playersNavLink"
            ),

        seasons:
            document.getElementById(
                "seasonsNavLink"
            )

    };


    Object.values(
        links
    )
        .forEach(
            link => {

                if (link) {

                    link.classList.remove(
                        "admin-nav-active"
                    );

                }

            }
        );


    if (
        links[page]
    ) {

        links[
            page
        ].classList.add(
            "admin-nav-active"
        );

    }

}