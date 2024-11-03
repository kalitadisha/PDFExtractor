let pdfinput = document.querySelector(".selectpdf");
let pwd = document.querySelector(".pwd");
let upload = document.querySelector(".upload");
let afterupload = document.querySelector(".afterupload");
let select = document.querySelector("select");
let download = document.querySelector(".download");
let pdftext = document.querySelector(".pdftext");
let alltext = "";
let wordFrequencyChart;

upload.addEventListener('click', () => {
    let file = pdfinput.files[0];
    if (file && file.type === "application/pdf") {
        let fr = new FileReader();
        fr.readAsDataURL(file);
        fr.onload = () => {
            let res = fr.result;
            extractText(res, pwd.value !== "");
        };
    } else {
        alert("Select a valid PDF file");
    }
});

async function extractText(url, pass) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.mjs';

    try {
        let pdf;
        if (pass) {
            pdf = await pdfjsLib.getDocument({ url: url, password: pwd.value }).promise;
        } else {
            pdf = await pdfjsLib.getDocument(url).promise;
        }
        let pages = pdf.numPages;
        const textPromises = [];

        for (let i = 1; i <= pages; i++) {
            textPromises.push(pdf.getPage(i).then(page => page.getTextContent().then(txt => {
                return txt.items.map((s) => s.str).join(" ");
            })));
        }

        alltext = await Promise.all(textPromises).then(results => results.join(" "));
        console.log(alltext);

        select.innerHTML += `<option value="1">${1} (All Pages)</option>`;
        afterProcess();
    } catch (err) {
        alert(err.message);
    }
}

function afterProcess() {
    pdftext.value = alltext;
    download.href = "data:text/plain;charset=utf-8," + encodeURIComponent(alltext);
    afterupload.style.display = "flex";

    updateAgeDistributionChart(alltext);
}

function updateAgeDistributionChart(text) {
    const ageCounts = {
        "0-10": 0,
        "11-20": 0,
        "21-30": 0,
        "31-40": 0,
        "41-50": 0,
        "51-60": 0,
        "61-70": 0,
        "71-80": 0,
        "81-90": 0,
        "91-100": 0
    };
    const ageRegex = /(\d{1,3})/g;

    const matches = text.match(ageRegex);
    if (matches) {
        matches.forEach(ageStr => {
            const age = parseInt(ageStr, 10);
            if (age >= 0 && age <= 100) {
                if (age <= 10) ageCounts["0-10"]++;
                else if (age <= 20) ageCounts["11-20"]++;
                else if (age <= 30) ageCounts["21-30"]++;
                else if (age <= 40) ageCounts["31-40"]++;
                else if (age <= 50) ageCounts["41-50"]++;
                else if (age <= 60) ageCounts["51-60"]++;
                else if (age <= 70) ageCounts["61-70"]++;
                else if (age <= 80) ageCounts["71-80"]++;
                else if (age <= 90) ageCounts["81-90"]++;
                else ageCounts["91-100"]++;
            }
        });
    }

    const labels = Object.keys(ageCounts);
    const data = Object.values(ageCounts);

    if (wordFrequencyChart) {
        wordFrequencyChart.destroy();
    }

    const ctx = document.getElementById('wordFrequencyChart').getContext('2d');
    wordFrequencyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Age Distribution',
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function downloadChartAsPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();
    
    // Convert canvas to image data
    const canvas = document.getElementById("wordFrequencyChart");
    const imgData = canvas.toDataURL("image/png");

    // Add image to PDF
    pdf.addImage(imgData, "PNG", 10, 10, 180, 80);
    pdf.save("chart.pdf");
}
