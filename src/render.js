const ctx = document.getElementById("sendMetricsChart");
const { Chart } = require("chart.js/auto");

const loadChart = () => {
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
      datasets: [
        {
          data: [12, 19, 3, 5, 2, 3],
          backgroundColor: "#00d1b2",
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
};

loadChart();

// var dropdown = document.querySelector(".dropdown");
// dropdown.addEventListener("click", function (event) {
//   event.stopPropagation();
//   dropdown.classList.toggle("is-active");
// });
