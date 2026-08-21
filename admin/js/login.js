
const loginForm =
    document.getElementById(
        "loginForm"
    );


const loginError =
    document.getElementById(
        "loginError"
    );


// ==========================================
// CHECK EXISTING SESSION
// ==========================================

async function checkExistingLogin() {

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

        return;

    }


    if (
        data.session
    ) {

        window.location.href =
            "scores.html";

    }

}


// ==========================================
// LOGIN
// ==========================================

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        loginError.textContent =
            "";


        const email =
            document
                .getElementById(
                    "email"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "password"
                )
                .value;


        const {
            error
        } =
            await supabaseClient.auth
                .signInWithPassword({

                    email:
                        email,

                    password:
                        password

                });


        if (error) {

            console.error(
                "Login failed:",
                error
            );


            loginError.textContent =
                error.message;


            return;

        }


        window.location.href =
            "scores.html";

    }
);


// ==========================================
// START
// ==========================================

checkExistingLogin();