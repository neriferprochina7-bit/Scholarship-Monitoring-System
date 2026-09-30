// ======================================================
// SCHOLARSHIP MONITORING SYSTEM
// COMPLETE APP.JS
// ======================================================

// ======================================================
// SUPABASE CONNECTION
// ======================================================

const SUPABASE_URL =
    "https://frvmgslpyopugcxsgqeu.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_9m-Xkx3Yr6a5zEcGnGmB0Q_xChoQnJ0";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ======================================================
// GLOBAL VARIABLES
// ======================================================

let currentUser = null;
let currentProfile = null;


// ======================================================
// ELEMENTS
// ======================================================

const loginPage =
    document.getElementById("loginPage");

const appPage =
    document.getElementById("appPage");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const loginBtn =
    document.getElementById("loginBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const loginMessage =
    document.getElementById("loginMessage");


// ======================================================
// HELPER
// ======================================================

function showLoginPage() {

    if (appPage) {
        appPage.classList.add("hidden");
    }

    if (loginPage) {
        loginPage.classList.remove("hidden");
    }
}


function showAppPage() {

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (appPage) {
        appPage.classList.remove("hidden");
    }
}


function setMessage(element, message, type = "") {

    if (!element) return;

    element.textContent = message;

    element.className = "message";

    if (type) {
        element.classList.add(type);
    }
}


function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ======================================================
// LOGIN
// ======================================================

if (loginBtn) {

    loginBtn.addEventListener(
        "click",
        loginUser
    );
}


if (passwordInput) {

    passwordInput.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {
                loginUser();
            }

        }
    );
}

// ========================================
// LOGIN
// ========================================

async function loginUser() {

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    loginMessage.textContent = "";

    if (!email || !password) {
        loginMessage.textContent =
            "Please enter your email and password.";
        return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in...";

    try {

        console.log("LOGIN START:", email);

        const {
            data,
            error
        } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        // ========================================
        // AUTH ERROR
        // ========================================

        if (error) {

            console.error("AUTH ERROR:", error);

            loginMessage.textContent =
                error.message;

            return;
        }

        // ========================================
        // AUTH SUCCESS
        // ========================================

        if (!data || !data.user) {

            loginMessage.textContent =
                "Login failed. User information was not returned.";

            return;
        }

        console.log(
            "AUTH SUCCESS:",
            data.user
        );

        currentUser = data.user;

        // ========================================
        // LOAD APPLICATION
        // ========================================

        await loadApplication(data.user);

    } catch (error) {

        console.error(
            "LOGIN UNEXPECTED ERROR:",
            error
        );

        loginMessage.textContent =
            "Login error: " + error.message;

    } finally {

        loginBtn.disabled = false;
        loginBtn.textContent = "Sign In";
    }
}


// ======================================================
// LOAD APPLICATION
// ======================================================

async function loadApplication(user) {

    try {

        console.log(
            "Loading profile for Auth User ID:",
            user.id
        );


        // ------------------------------------------------
        // GET PROFILE
        // ------------------------------------------------

        const {
            data: profile,
            error: profileError
        } =
            await supabaseClient
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .maybeSingle();


        if (profileError) {

            console.error(
                "PROFILE QUERY ERROR:",
                profileError
            );


            alert(
                "Profile query failed:\n\n" +
                profileError.message +
                "\n\nCode: " +
                profileError.code
            );

            return false;
        }


        // ------------------------------------------------
        // PROFILE DOES NOT EXIST
        // ------------------------------------------------

        if (!profile) {

            console.error(
                "NO PROFILE FOUND.",
                "Auth ID:",
                user.id
            );


            alert(
                "Login successful, but no profile was found.\n\n" +
                "Your Supabase Auth User ID is:\n" +
                user.id +
                "\n\n" +
                "This ID must match the id column in public.profiles."
            );

            return false;
        }


        // ------------------------------------------------
        // SAVE PROFILE
        // ------------------------------------------------

        currentProfile =
            profile;


        console.log(
            "PROFILE FOUND:",
            currentProfile
        );


        // ------------------------------------------------
        // CHECK ROLE
        // ------------------------------------------------

        const role =
            String(
                profile.role || ""
            ).toLowerCase().trim();


        if (
            role !== "admin" &&
            role !== "staff" &&
            role !== "scholar"
        ) {

            alert(
                "Invalid profile role.\n\n" +
                "Current role: " +
                profile.role
            );

            return false;
        }


        // ------------------------------------------------
        // SHOW APP
        // ------------------------------------------------

        showAppPage();


        // ------------------------------------------------
        // DISPLAY USER INFORMATION
        // ------------------------------------------------

        const welcomeName =
            document.getElementById(
                "welcomeName"
            );

        const userRole =
            document.getElementById(
                "userRole"
            );

        const dashboardWelcome =
            document.getElementById(
                "dashboardWelcome"
            );


        if (welcomeName) {

            welcomeName.textContent =
                profile.full_name ||
                user.email;
        }


        if (userRole) {

            userRole.textContent =
                role.toUpperCase();
        }


        if (dashboardWelcome) {

            dashboardWelcome.textContent =
                "Welcome, " +
                (
                    profile.full_name ||
                    user.email
                );
        }


        // ------------------------------------------------
        // LOAD DATABASE
        // ------------------------------------------------

        await refreshAllData();


        // ------------------------------------------------
        // ROLE BASED TOOLS
        // ------------------------------------------------

        createManagementTools();


        // ------------------------------------------------
        // DEFAULT SECTION
        // ------------------------------------------------

        showSection("dashboard");


        return true;

    }

    catch (err) {

        console.error(
            "LOAD APPLICATION ERROR:",
            err
        );

        alert(
            "Unable to load the application.\n\n" +
            err.message
        );

        return false;
    }
}


// ======================================================
// REFRESH EVERYTHING
// ======================================================

async function refreshAllData() {

    await loadDashboard();

    await loadScholarshipPrograms();

    await loadScholars();

    await loadGrades();
}


// ======================================================
// DASHBOARD
// ======================================================

async function loadDashboard() {

    console.log(
        "Loading dashboard..."
    );


    // ------------------------------------------------
    // TOTAL SCHOLARS
    // ------------------------------------------------

    const {
        count: scholarCount,
        error: scholarError
    } =
        await supabaseClient
            .from("scholars")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            );


    const totalScholars =
        document.getElementById(
            "totalScholars"
        );


    if (scholarError) {

        console.error(
            "TOTAL SCHOLARS ERROR:",
            scholarError
        );

        if (totalScholars) {
            totalScholars.textContent =
                "ERROR";
        }

    } else {

        if (totalScholars) {

            totalScholars.textContent =
                scholarCount ?? 0;
        }
    }


    // ------------------------------------------------
    // PENDING
    // ------------------------------------------------

    const {
        count: pendingCount,
        error: pendingError
    } =
        await supabaseClient
            .from("grade_submissions")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "submission_status",
                "Pending"
            );


    const pendingElement =
        document.getElementById(
            "pendingSubmissions"
        );


    if (pendingError) {

        console.error(
            "PENDING ERROR:",
            pendingError
        );

        if (pendingElement) {
            pendingElement.textContent =
                "ERROR";
        }

    } else {

        if (pendingElement) {

            pendingElement.textContent =
                pendingCount ?? 0;
        }
    }


    // ------------------------------------------------
    // VERIFIED
    // ------------------------------------------------

    const {
        count: verifiedCount,
        error: verifiedError
    } =
        await supabaseClient
            .from("grade_submissions")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "submission_status",
                "Verified"
            );


    const verifiedElement =
        document.getElementById(
            "verifiedSubmissions"
        );


    if (verifiedError) {

        console.error(
            "VERIFIED ERROR:",
            verifiedError
        );

        if (verifiedElement) {
            verifiedElement.textContent =
                "ERROR";
        }

    } else {

        if (verifiedElement) {

            verifiedElement.textContent =
                verifiedCount ?? 0;
        }
    }


    // ------------------------------------------------
    // COMPLIANCE
    // ------------------------------------------------

    await loadComplianceCounts();
}


// ======================================================
// COMPLIANCE COUNTS
// ======================================================

async function loadComplianceCounts() {

    const compliantElement =
        document.getElementById(
            "compliantScholars"
        );

    const deficiencyElement =
        document.getElementById(
            "deficiencyScholars"
        );


    try {

        // Get verified submissions
        const {
            data: grades,
            error
        } =
            await supabaseClient
                .from("grade_submissions")
                .select(`
                    id,
                    scholar_id,
                    gwa,
                    units_enrolled,
                    failed_subjects,
                    incomplete_subjects,
                    submission_status,
                    scholars (
                        id,
                        scholarship_id
                    )
                `)
                .eq(
                    "submission_status",
                    "Verified"
                );


        if (error) {

            console.error(
                "COMPLIANCE QUERY ERROR:",
                error
            );

            if (compliantElement) {
                compliantElement.textContent =
                    "ERROR";
            }

            if (deficiencyElement) {
                deficiencyElement.textContent =
                    "ERROR";
            }

            return;
        }


        if (!grades || grades.length === 0) {

            if (compliantElement) {
                compliantElement.textContent =
                    "0";
            }

            if (deficiencyElement) {
                deficiencyElement.textContent =
                    "0";
            }

            return;
        }


        // Get all scholarship programs
        const {
            data: programs,
            error: programError
        } =
            await supabaseClient
                .from("scholarship_programs")
                .select(`
                    id,
                    required_gwa,
                    min_units,
                    allow_failing_grade
                `);


        if (programError) {

            console.error(
                "PROGRAM RULE ERROR:",
                programError
            );

            if (compliantElement) {
                compliantElement.textContent =
                    "ERROR";
            }

            if (deficiencyElement) {
                deficiencyElement.textContent =
                    "ERROR";
            }

            return;
        }


        const programMap =
            new Map();


        (programs || []).forEach(
            program => {

                programMap.set(
                    Number(program.id),
                    program
                );
            }
        );


        // ------------------------------------------------
        // Use latest verified submission per scholar
        // ------------------------------------------------

        const latestByScholar =
            new Map();


        grades.forEach(
            grade => {

                const scholarId =
                    Number(
                        grade.scholar_id
                    );


                if (
                    !latestByScholar.has(
                        scholarId
                    ) ||
                    Number(grade.id) >
                    Number(
                        latestByScholar
                            .get(scholarId)
                            .id
                    )
                ) {

                    latestByScholar.set(
                        scholarId,
                        grade
                    );
                }
            }
        );


        let compliant = 0;
        let deficiency = 0;


        latestByScholar.forEach(
            grade => {

                const scholar =
                    grade.scholars;


                if (!scholar) {
                    return;
                }


                const scholarshipId =
                    Number(
                        scholar.scholarship_id
                    );


                const program =
                    programMap.get(
                        scholarshipId
                    );


                if (!program) {
                    return;
                }


                const result =
                    evaluateGradeAgainstProgram(
                        grade,
                        program
                    );


                if (result.compliant) {

                    compliant++;

                } else {

                    deficiency++;
                }
            }
        );


        if (compliantElement) {

            compliantElement.textContent =
                compliant;
        }


        if (deficiencyElement) {

            deficiencyElement.textContent =
                deficiency;
        }

    }

    catch (err) {

        console.error(
            "COMPLIANCE COUNT ERROR:",
            err
        );

        if (compliantElement) {
            compliantElement.textContent =
                "ERROR";
        }

        if (deficiencyElement) {
            deficiencyElement.textContent =
                "ERROR";
        }
    }
}


// ======================================================
// EVALUATE GRADE
// ======================================================

function evaluateGradeAgainstProgram(
    grade,
    program
) {

    const gwaPass =
        Number(grade.gwa) <=
        Number(program.required_gwa);


    const unitsPass =
        Number(grade.units_enrolled) >=
        Number(program.min_units);


    const failingPass =
        Boolean(
            program.allow_failing_grade
        ) ||
        Number(grade.failed_subjects) === 0;


    const incompletePass =
        Number(
            grade.incomplete_subjects
        ) === 0;


    const compliant =
        gwaPass &&
        unitsPass &&
        failingPass &&
        incompletePass;


    return {

        compliant,

        gwaPass,

        unitsPass,

        failingPass,

        incompletePass
    };
}


// ======================================================
// SCHOLARSHIP PROGRAMS
// ======================================================

async function loadScholarshipPrograms() {

    const dashboard =
        document.getElementById(
            "dashboardPrograms"
        );

    const programsList =
        document.getElementById(
            "programsList"
        );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("scholarship_programs")
            .select("*")
            .order("id");


    if (error) {

        console.error(
            "PROGRAM ERROR:",
            error
        );

        if (dashboard) {

            dashboard.innerHTML =
                `<p>Error loading scholarship programs:
                ${escapeHTML(error.message)}</p>`;
        }

        if (programsList) {

            programsList.innerHTML =
                `<p>Error loading scholarship programs:
                ${escapeHTML(error.message)}</p>`;
        }

        return;
    }


    if (!data || data.length === 0) {

        if (dashboard) {

            dashboard.innerHTML =
                "<p>No scholarship programs found.</p>";
        }

        if (programsList) {

            programsList.innerHTML =
                "<p>No scholarship programs found.</p>";
        }

        return;
    }


    const html =
        data.map(
            program => {

                return `

                    <div class="program-card">

                        <h3>
                            🎓
                            ${escapeHTML(
                                program.program_name
                            )}
                        </h3>

                        <div class="program-detail">

                            <span>
                                Required GWA
                            </span>

                            <strong>
                                ${program.required_gwa}
                            </strong>

                        </div>

                        <div class="program-detail">

                            <span>
                                Minimum Units
                            </span>

                            <strong>
                                ${program.min_units}
                            </strong>

                        </div>

                        <div class="program-detail">

                            <span>
                                Failing Grade
                            </span>

                            <strong>
                                ${
                                    program.allow_failing_grade
                                    ? "Allowed"
                                    : "Not Allowed"
                                }
                            </strong>

                        </div>

                        <div class="program-detail">

                            <span>
                                Status
                            </span>

                            <strong>
                                ${
                                    program.active
                                    ? "Active"
                                    : "Inactive"
                                }
                            </strong>

                        </div>

                    </div>
                `;
            }
        ).join("");


    if (dashboard) {

        dashboard.innerHTML =
            html;
    }


    if (programsList) {

        programsList.innerHTML =
            html;
    }
}


// ======================================================
// SCHOLARS
// ======================================================

async function loadScholars() {

    const table =
        document.getElementById(
            "scholarsTable"
        );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("scholars")
            .select(`
                id,
                student_id,
                full_name,
                degree_program,
                year_level,
                scholarship_id,
                status,
                scholarship_programs (
                    program_name
                )
            `)
            .order("id");


    if (error) {

        console.error(
            "SCHOLARS LOAD ERROR:",
            error
        );


        if (table) {

            table.innerHTML = `

                <tr>

                    <td colspan="6">

                        Error loading scholars:
                        ${escapeHTML(
                            error.message
                        )}

                    </td>

                </tr>
            `;
        }

        return;
    }


    if (!data || data.length === 0) {

        if (table) {

            table.innerHTML = `

                <tr>

                    <td colspan="6">

                        No scholar records yet.

                    </td>

                </tr>
            `;
        }

        return;
    }


    if (table) {

        table.innerHTML =
            data.map(
                scholar => {

                    const scholarship =
                        scholar.scholarship_programs
                            ? scholar.scholarship_programs.program_name
                            : "Not Assigned";


                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    scholar.student_id
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    scholar.full_name
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    scholar.degree_program
                                )}
                            </td>

                            <td>
                                ${scholar.year_level}
                            </td>

                            <td>
                                ${escapeHTML(
                                    scholarship
                                )}
                            </td>

                            <td>

                                <span class="status active">

                                    ${escapeHTML(
                                        scholar.status ||
                                        "Active"
                                    )}

                                </span>

                            </td>

                        </tr>

                    `;
                }
            ).join("");
    }
}


// ======================================================
// GRADE SUBMISSIONS
// ======================================================

async function loadGrades() {

    const table =
        document.getElementById(
            "gradesTable"
        );


    const {
        data,
        error
    } =
        await supabaseClient
            .from("grade_submissions")
            .select(`
                id,
                scholar_id,
                academic_year,
                semester,
                gwa,
                units_enrolled,
                failed_subjects,
                incomplete_subjects,
                submission_status,
                submitted_at,
                scholars (
                    full_name,
                    student_id
                )
            `)
            .order(
                "id",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(
            "GRADE LOAD ERROR:",
            error
        );


        if (table) {

            table.innerHTML = `

                <tr>

                    <td colspan="6">

                        Error loading grades:
                        ${escapeHTML(
                            error.message
                        )}

                    </td>

                </tr>
            `;
        }

        return;
    }


    if (!data || data.length === 0) {

        if (table) {

            table.innerHTML = `

                <tr>

                    <td colspan="6">

                        No grade submissions yet.

                    </td>

                </tr>
            `;
        }

        return;
    }


    if (table) {

        table.innerHTML =
            data.map(
                grade => {

                    const scholar =
                        grade.scholars
                            ? grade.scholars.full_name
                            : "Unknown";


                    const statusClass =
                        grade.submission_status ===
                        "Verified"
                            ? "verified"
                            : "pending";


                    return `

                        <tr>

                            <td>
                                ${escapeHTML(
                                    scholar
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    grade.academic_year
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    grade.semester
                                )}
                            </td>

                            <td>
                                ${grade.gwa}
                            </td>

                            <td>
                                ${grade.units_enrolled}
                            </td>

                            <td>

                                <span class="status ${statusClass}">

                                    ${escapeHTML(
                                        grade.submission_status
                                    )}

                                </span>

                            </td>

                        </tr>

                    `;
                }
            ).join("");
    }
}


// ======================================================
// ROLE MANAGEMENT
// ======================================================

function createManagementTools() {

    if (!currentProfile) {
        return;
    }


    const role =
        String(
            currentProfile.role
        ).toLowerCase()
        .trim();


    console.log(
        "CURRENT ROLE:",
        role
    );


    // ------------------------------------------------
    // ADMIN
    // ------------------------------------------------

    if (role === "admin") {

        createScholarForm();
    }


    // ------------------------------------------------
    // STAFF
    // ------------------------------------------------

    if (role === "staff") {

        createVerificationTools();
    }


    // ------------------------------------------------
    // SCHOLAR
    // ------------------------------------------------

    if (role === "scholar") {

        createGradeSubmissionForm();
    }
}


// ======================================================
// ADMIN - ADD SCHOLAR FORM
// ======================================================

function createScholarForm() {

    if (
        document.getElementById(
            "dynamicScholarPanel"
        )
    ) {
        return;
    }


    const scholarsSection =
        document.getElementById(
            "scholars"
        );


    if (!scholarsSection) {

        console.warn(
            "Element #scholars not found."
        );

        return;
    }


    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "dynamicScholarPanel";

    panel.className =
        "panel";


    panel.innerHTML = `

        <h3>
            ➕ Register New Scholar
        </h3>

        <form id="dynamicScholarForm">

            <label>
                Student ID
            </label>

            <input
                id="newStudentId"
                type="text"
                placeholder="2026-002"
                required
            >


            <label>
                Full Name
            </label>

            <input
                id="newScholarName"
                type="text"
                placeholder="Juan Dela Cruz"
                required
            >


            <label>
                Degree Program
            </label>

            <input
                id="newDegreeProgram"
                type="text"
                placeholder="BSIT"
                required
            >


            <label>
                Year Level
            </label>

            <input
                id="newYearLevel"
                type="number"
                min="1"
                max="6"
                required
            >


            <label>
                Scholarship Program
            </label>

            <select
                id="newScholarship"
                required
            >

                <option value="">
                    Loading scholarships...
                </option>

            </select>


            <label>
                Status
            </label>

            <select
                id="newScholarStatus"
            >

                <option value="Active">
                    Active
                </option>

                <option value="Pending Submission">
                    Pending Submission
                </option>

            </select>


            <button
                type="submit"
                class="primary-btn"
            >

                Add Scholar

            </button>


            <p
                id="scholarFormMessage"
                class="message"
            ></p>

        </form>

    `;


    scholarsSection.prepend(
        panel
    );


    loadScholarOptions();


    const form =
        document.getElementById(
            "dynamicScholarForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            addScholar
        );
    }
}


// ======================================================
// LOAD SCHOLARSHIP OPTIONS
// ======================================================

async function loadScholarOptions() {

    const select =
        document.getElementById(
            "newScholarship"
        );


    if (!select) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("scholarship_programs")
            .select(
                "id, program_name"
            )
            .eq(
                "active",
                true
            )
            .order("id");


    if (error) {

        console.error(
            "SCHOLARSHIP OPTIONS ERROR:",
            error
        );


        select.innerHTML = `

            <option value="">
                Error loading scholarships
            </option>

        `;

        return;
    }


    select.innerHTML = `

        <option value="">
            Select Scholarship
        </option>

    `;


    (data || []).forEach(
        program => {

            select.innerHTML += `

                <option
                    value="${program.id}"
                >

                    ${escapeHTML(
                        program.program_name
                    )}

                </option>

            `;
        }
    );
}


// ======================================================
// ADD SCHOLAR
// ======================================================

async function addScholar(event) {

    event.preventDefault();


    const message =
        document.getElementById(
            "scholarFormMessage"
        );


    // ------------------------------------------------
    // SECURITY CHECK
    // ------------------------------------------------

    if (
        !currentProfile ||
        currentProfile.role !== "admin"
    ) {

        setMessage(
            message,
            "Only Administrator can register a scholar."
        );

        return;
    }


    const studentId =
        document.getElementById(
            "newStudentId"
        ).value.trim();


    const fullName =
        document.getElementById(
            "newScholarName"
        ).value.trim();


    const degreeProgram =
        document.getElementById(
            "newDegreeProgram"
        ).value.trim();


    const yearLevel =
        Number(
            document.getElementById(
                "newYearLevel"
            ).value
        );


    const scholarshipValue =
        document.getElementById(
            "newScholarship"
        ).value;


    const scholarshipId =
        Number(
            scholarshipValue
        );


    const status =
        document.getElementById(
            "newScholarStatus"
        ).value;


    // ------------------------------------------------
    // VALIDATION
    // ------------------------------------------------

    if (
        !studentId ||
        !fullName ||
        !degreeProgram ||
        !yearLevel ||
        !scholarshipValue
    ) {

        setMessage(
            message,
            "Please complete all required fields."
        );

        return;
    }


    // ------------------------------------------------
    // CHECK DUPLICATE
    // ------------------------------------------------

    const {
        data: existing,
        error: duplicateError
    } =
        await supabaseClient
            .from("scholars")
            .select("id")
            .eq(
                "student_id",
                studentId
            )
            .maybeSingle();


    if (duplicateError) {

        console.error(
            "DUPLICATE CHECK ERROR:",
            duplicateError
        );

        setMessage(
            message,
            "Unable to check Student ID: " +
            duplicateError.message
        );

        return;
    }


    if (existing) {

        setMessage(
            message,
            "Student ID already exists."
        );

        return;
    }


    // ------------------------------------------------
    // INSERT
    // ------------------------------------------------

    const {
        data,
        error
    } =
        await supabaseClient
            .from("scholars")
            .insert({

                student_id:
                    studentId,

                full_name:
                    fullName,

                degree_program:
                    degreeProgram,

                year_level:
                    yearLevel,

                scholarship_id:
                    scholarshipId,

                status:
                    status

            })
            .select()
            .single();


    if (error) {

        console.error(
            "ADD SCHOLAR ERROR:",
            error
        );


        setMessage(
            message,
            "Failed to add scholar: " +
            error.message
        );

        return;
    }


    console.log(
        "SCHOLAR ADDED:",
        data
    );


    setMessage(
        message,
        "Scholar added successfully!"
    );


    const form =
        document.getElementById(
            "dynamicScholarForm"
        );


    if (form) {
        form.reset();
    }


    // ------------------------------------------------
    // REFRESH
    // ------------------------------------------------

    await loadScholars();

    await loadDashboard();
}


// ======================================================
// SCHOLAR - GRADE FORM
// ======================================================

function createGradeSubmissionForm() {

    if (
        document.getElementById(
            "dynamicGradePanel"
        )
    ) {
        return;
    }


    const dashboard =
        document.getElementById(
            "dashboard"
        );


    if (!dashboard) {

        console.warn(
            "Element #dashboard not found."
        );

        return;
    }


    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "dynamicGradePanel";

    panel.className =
        "panel";


    panel.innerHTML = `

        <h3>
            📚 Submit Semester Grades
        </h3>

        <form id="dynamicGradeForm">

            <label>
                Scholar
            </label>

            <select
                id="gradeScholar"
                required
            ></select>


            <label>
                Academic Year
            </label>

            <input
                id="gradeAcademicYear"
                type="text"
                placeholder="2026-2027"
                required
            >


            <label>
                Semester
            </label>

            <select
                id="gradeSemester"
                required
            >

                <option value="">
                    Select Semester
                </option>

                <option value="1st Semester">
                    1st Semester
                </option>

                <option value="2nd Semester">
                    2nd Semester
                </option>

                <option value="Summer">
                    Summer
                </option>

            </select>


            <label>
                GWA
            </label>

            <input
                id="gradeGwa"
                type="number"
                step="0.01"
                min="1"
                max="5"
                required
            >


            <label>
                Units Enrolled
            </label>

            <input
                id="gradeUnits"
                type="number"
                min="0"
                required
            >


            <label>
                Failed Subjects
            </label>

            <input
                id="failedSubjects"
                type="number"
                min="0"
                value="0"
                required
            >


            <label>
                Incomplete Subjects
            </label>

            <input
                id="incompleteSubjects"
                type="number"
                min="0"
                value="0"
                required
            >


            <button
                type="submit"
                class="primary-btn"
            >

                Submit Grades

            </button>


            <p
                id="gradeFormMessage"
                class="message"
            ></p>

        </form>

    `;


    dashboard.prepend(
        panel
    );


    loadGradeScholarOptions();


    const form =
        document.getElementById(
            "dynamicGradeForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            submitGrades
        );
    }
}


// ======================================================
// LOAD SCHOLARS FOR GRADE FORM
// ======================================================

async function loadGradeScholarOptions() {

    const select =
        document.getElementById(
            "gradeScholar"
        );


    if (!select) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("scholars")
            .select(
                "id, student_id, full_name"
            )
            .order("full_name");


    if (error) {

        console.error(
            "GRADE SCHOLAR OPTIONS ERROR:",
            error
        );


        select.innerHTML = `

            <option value="">
                Error loading scholars
            </option>

        `;

        return;
    }


    select.innerHTML = `

        <option value="">
            Select Scholar
        </option>

    `;


    (data || []).forEach(
        scholar => {

            select.innerHTML += `

                <option
                    value="${scholar.id}"
                >

                    ${escapeHTML(
                        scholar.student_id
                    )}
                    -
                    ${escapeHTML(
                        scholar.full_name
                    )}

                </option>

            `;
        }
    );
}


// ======================================================
// SUBMIT GRADES
// ======================================================

async function submitGrades(event) {

    event.preventDefault();


    const message =
        document.getElementById(
            "gradeFormMessage"
        );


    if (
        !currentProfile ||
        currentProfile.role !== "scholar"
    ) {

        setMessage(
            message,
            "Only Scholar can submit grades."
        );

        return;
    }


    const scholarId =
        Number(
            document.getElementById(
                "gradeScholar"
            ).value
        );


    const academicYear =
        document.getElementById(
            "gradeAcademicYear"
        ).value.trim();


    const semester =
        document.getElementById(
            "gradeSemester"
        ).value;


    const gwa =
        Number(
            document.getElementById(
                "gradeGwa"
            ).value
        );


    const units =
        Number(
            document.getElementById(
                "gradeUnits"
            ).value
        );


    const failed =
        Number(
            document.getElementById(
                "failedSubjects"
            ).value
        );


    const incomplete =
        Number(
            document.getElementById(
                "incompleteSubjects"
            ).value
        );


    if (
        !scholarId ||
        !academicYear ||
        !semester
    ) {

        setMessage(
            message,
            "Please complete the required fields."
        );

        return;
    }


    if (
        gwa < 1 ||
        gwa > 5
    ) {

        setMessage(
            message,
            "GWA must be between 1.00 and 5.00."
        );

        return;
    }


    if (
        units < 0 ||
        failed < 0 ||
        incomplete < 0
    ) {

        setMessage(
            message,
            "Values cannot be negative."
        );

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("grade_submissions")
            .insert({

                scholar_id:
                    scholarId,

                academic_year:
                    academicYear,

                semester:
                    semester,

                gwa:
                    gwa,

                units_enrolled:
                    units,

                failed_subjects:
                    failed,

                incomplete_subjects:
                    incomplete,

                submission_status:
                    "Pending",

                submitted_at:
                    new Date().toISOString()

            })
            .select()
            .single();


    if (error) {

        console.error(
            "GRADE SUBMISSION ERROR:",
            error
        );


        setMessage(
            message,
            "Failed to submit grades: " +
            error.message
        );

        return;
    }


    console.log(
        "GRADE SUBMITTED:",
        data
    );


    setMessage(
        message,
        "Grades submitted successfully. Status: Pending."
    );


    const form =
        document.getElementById(
            "dynamicGradeForm"
        );


    if (form) {
        form.reset();
    }


    await loadGrades();

    await loadDashboard();
}


// ======================================================
// STAFF - VERIFICATION TOOLS
// ======================================================

function createVerificationTools() {

    if (
        document.getElementById(
            "dynamicVerificationPanel"
        )
    ) {
        return;
    }


    const gradesSection =
        document.getElementById(
            "grades"
        );


    if (!gradesSection) {

        console.warn(
            "Element #grades not found."
        );

        return;
    }


    const panel =
        document.createElement(
            "div"
        );


    panel.id =
        "dynamicVerificationPanel";

    panel.className =
        "panel";


    panel.innerHTML = `

        <h3>
            ✅ Verify Grade Submission
        </h3>


        <select
            id="verificationGrade"
        >

            <option value="">
                Select Pending Submission
            </option>

        </select>


        <button
            id="verifyGradeButton"
            class="primary-btn"
        >

            Verify Selected Grade

        </button>


        <p
            id="verificationMessage"
            class="message"
        ></p>

    `;


    gradesSection.prepend(
        panel
    );


    loadPendingGrades();


    const button =
        document.getElementById(
            "verifyGradeButton"
        );


    if (button) {

        button.addEventListener(
            "click",
            verifyGrade
        );
    }
}


// ======================================================
// LOAD PENDING GRADES
// ======================================================

async function loadPendingGrades() {

    const select =
        document.getElementById(
            "verificationGrade"
        );


    if (!select) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("grade_submissions")
            .select(`
                id,
                academic_year,
                semester,
                gwa,
                scholars (
                    full_name
                )
            `)
            .eq(
                "submission_status",
                "Pending"
            )
            .order("id");


    if (error) {

        console.error(
            "PENDING GRADE ERROR:",
            error
        );


        select.innerHTML = `

            <option value="">
                Error loading pending grades
            </option>

        `;

        return;
    }


    select.innerHTML = `

        <option value="">
            Select Pending Submission
        </option>

    `;


    (data || []).forEach(
        grade => {

            const scholarName =
                grade.scholars
                    ? grade.scholars.full_name
                    : "Unknown";


            select.innerHTML += `

                <option
                    value="${grade.id}"
                >

                    ${escapeHTML(
                        scholarName
                    )}
                    -
                    ${escapeHTML(
                        grade.academic_year
                    )}
                    -
                    ${escapeHTML(
                        grade.semester
                    )}
                    -
                    GWA ${grade.gwa}

                </option>

            `;
        }
    );
}


// ======================================================
// VERIFY GRADE
// ======================================================

async function verifyGrade() {

    const select =
        document.getElementById(
            "verificationGrade"
        );


    const message =
        document.getElementById(
            "verificationMessage"
        );


    if (
        !currentProfile ||
        currentProfile.role !== "staff"
    ) {

        setMessage(
            message,
            "Only Staff can verify grades."
        );

        return;
    }


    if (!select || !select.value) {

        setMessage(
            message,
            "Please select a pending submission."
        );

        return;
    }


    const gradeId =
        Number(
            select.value
        );


    // ------------------------------------------------
    // VERIFY
    // ------------------------------------------------

    const {
        data,
        error
    } =
        await supabaseClient
            .from("grade_submissions")
            .update({

                submission_status:
                    "Verified",

                verified_by:
                    currentUser.id,

                verified_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                gradeId
            )
            .select()
            .single();


    if (error) {

        console.error(
            "VERIFY ERROR:",
            error
        );


        setMessage(
            message,
            "Verification failed: " +
            error.message
        );

        return;
    }


    console.log(
        "GRADE VERIFIED:",
        data
    );


    // ------------------------------------------------
    // EVALUATE
    // ------------------------------------------------

    const evaluation =
        await evaluateCompliance(
            gradeId
        );


    if (!evaluation.success) {

        setMessage(
            message,
            "Grade verified, but compliance evaluation failed."
        );

    } else {

        setMessage(
            message,
            "Grade verified successfully. Compliance evaluated."
        );
    }


    await loadGrades();

    await loadPendingGrades();

    await loadDashboard();

    await loadScholars();
}


// ======================================================
// COMPLIANCE EVALUATION
// ======================================================

async function evaluateCompliance(
    gradeId
) {

    try {

        const {
            data: grade,
            error: gradeError
        } =
            await supabaseClient
                .from("grade_submissions")
                .select(`
                    id,
                    scholar_id,
                    gwa,
                    units_enrolled,
                    failed_subjects,
                    incomplete_subjects,
                    scholars (
                        scholarship_id
                    )
                `)
                .eq(
                    "id",
                    gradeId
                )
                .single();


        if (gradeError) {

            console.error(
                "EVALUATION GRADE ERROR:",
                gradeError
            );

            return {
                success: false
            };
        }


        if (!grade.scholars) {

            console.error(
                "Scholar information not found."
            );

            return {
                success: false
            };
        }


        const scholarshipId =
            Number(
                grade.scholars.scholarship_id
            );


        if (!scholarshipId) {

            console.error(
                "Scholar has no scholarship program."
            );

            return {
                success: false
            };
        }


        const {
            data: program,
            error: programError
        } =
            await supabaseClient
                .from("scholarship_programs")
                .select(`
                    required_gwa,
                    min_units,
                    allow_failing_grade
                `)
                .eq(
                    "id",
                    scholarshipId
                )
                .single();


        if (programError) {

            console.error(
                "PROGRAM EVALUATION ERROR:",
                programError
            );

            return {
                success: false
            };
        }


        const result =
            evaluateGradeAgainstProgram(
                grade,
                program
            );


        const newStatus =
            result.compliant
                ? "Compliant"
                : "With Deficiency";


        // ------------------------------------------------
        // Update scholar status
        // ------------------------------------------------

        const {
            error: updateError
        } =
            await supabaseClient
                .from("scholars")
                .update({

                    status:
                        newStatus

                })
                .eq(
                    "id",
                    grade.scholar_id
                );


        if (updateError) {

            console.error(
                "STATUS UPDATE ERROR:",
                updateError
            );

            return {
                success: false
            };
        }


        console.log(
            "SCHOLAR EVALUATED:",
            {
                scholarId:
                    grade.scholar_id,

                status:
                    newStatus,

                details:
                    result
            }
        );


        return {

            success: true,

            status:
                newStatus,

            details:
                result
        };

    }

    catch (err) {

        console.error(
            "COMPLIANCE EVALUATION ERROR:",
            err
        );

        return {
            success: false
        };
    }
}


// ======================================================
// NAVIGATION
// ======================================================

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;

                    if (section) {

                        showSection(
                            section
                        );
                    }
                }
            );
        }
    );


function showSection(
    sectionId
) {

    document
        .querySelectorAll(
            ".content-section"
        )
        .forEach(
            section => {

                section.classList.add(
                    "hidden"
                );
            }
        );


    const selected =
        document.getElementById(
            sectionId
        );


    if (selected) {

        selected.classList.remove(
            "hidden"
        );
    }


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );
            }
        );


    const activeButton =
        document.querySelector(
            `[data-section="${sectionId}"]`
        );


    if (activeButton) {

        activeButton.classList.add(
            "active"
        );


        const pageTitle =
            document.getElementById(
                "pageTitle"
            );


        if (pageTitle) {

            pageTitle.textContent =
                activeButton.textContent.trim();
        }
    }
}


// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            await supabaseClient
                .auth
                .signOut();


            currentUser =
                null;

            currentProfile =
                null;


            showLoginPage();


            if (emailInput) {
                emailInput.value = "";
            }


            if (passwordInput) {
                passwordInput.value = "";
            }


            if (loginMessage) {
                loginMessage.textContent = "";
            }
        }
    );
}


// ======================================================
// CHECK EXISTING SESSION
// ======================================================

async function checkExistingSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {

            console.error(
                "SESSION ERROR:",
                error
            );

            showLoginPage();

            return;
        }


        if (
            data &&
            data.session &&
            data.session.user
        ) {

            console.log(
                "Existing session found."
            );


            currentUser =
                data.session.user;


            const success =
                await loadApplication(
                    currentUser
                );


            if (!success) {

                await supabaseClient
                    .auth
                    .signOut();

                showLoginPage();
            }

        } else {

            showLoginPage();
        }

    }

    catch (err) {

        console.error(
            "SESSION CHECK ERROR:",
            err
        );

        showLoginPage();
    }
}


// ======================================================
// START APPLICATION
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        checkExistingSession();

    }
);