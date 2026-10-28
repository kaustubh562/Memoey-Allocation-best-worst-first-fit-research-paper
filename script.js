
"use strict";

const blocksInput = document.getElementById("blocks");
const processesInput = document.getElementById("processes");
const results = document.getElementById("results");
const errorMessage = document.getElementById("error");

const DEFAULT_BLOCKS = "150, 150, 350";
const DEFAULT_PROCESSES = "300, 25, 125, 50";

function readSizes(input, label) {
    const values = input.split(",").map(value => value.trim());

    if (!values.length || values.some(value => value === "")) {
        throw new Error(label + " must contain comma-separated sizes.");
    }

    const numbers = values.map(Number);

    if (numbers.some(value =>
        !Number.isSafeInteger(value) || value <= 0
    )) {
        throw new Error(label + " must contain positive whole numbers.");
    }

    return numbers;
}

function allocateMemory(blocks, processes, algorithm) {
    const remaining = [...blocks];
    const allocations = [];
    let checks = 0;

    processes.forEach((size, index) => {
        let selected = -1;

        for (let i = 0; i < remaining.length; i++) {
            checks++;

            if (remaining[i] < size) {
                continue;
            }

            if (algorithm === "First Fit") {
                selected = i;
                break;
            }

            if (
                selected === -1 ||
                (algorithm === "Best Fit" &&
                    remaining[i] < remaining[selected]) ||
                (algorithm === "Worst Fit" &&
                    remaining[i] > remaining[selected])
            ) {
                selected = i;
            }
        }

        if (selected === -1) {
            allocations.push({
                process: index + 1,
                size,
                block: null
            });
            return;
        }

        remaining[selected] -= size;

        allocations.push({
            process: index + 1,
            size,
            block: selected + 1,
            remaining: remaining[selected]
        });
    });

    const successful = allocations.filter(
        item => item.block !== null
    );

    const totalMemory = blocks.reduce(
        (sum, size) => sum + size, 0
    );

    const usedMemory = successful.reduce(
        (sum, item) => sum + item.size, 0
    );

    return {
        algorithm,
        remaining,
        allocations,
        checks,
        totalMemory,
        usedMemory,
        freeMemory: remaining.reduce((sum, size) => sum + size, 0),
        allocatedCount: successful.length,
        processCount: processes.length,
        rate: Math.round(
            successful.length / processes.length * 100
        )
    };
}

function createBlockRows(blocks, result) {
    return result.remaining.map((free, index) => {
        const used = blocks[index] - free;
        const percentage = used / blocks[index] * 100;

        return `
            <div class="block-row">
                <div class="block-label">
                    <strong>Block ${index + 1}</strong>
                    <span>${used} KB used · ${free} KB free</span>
                </div>
                <div class="bar"
                     role="img"
                     aria-label="Block ${index + 1}: ${used} KB used, ${free} KB free">
                    <div class="bar-used"
                         style="width:${percentage}%"></div>
                </div>
            </div>
        `;
    }).join("");
}

function createProcessRows(result) {
    return result.allocations.map(item => {
        if (item.block === null) {
            return `
                <li class="process-item">
                    <span class="fail">✕</span>
                    <span>
                        <strong>P${item.process}</strong>
                        (${item.size} KB) — Not allocated
                    </span>
                </li>
            `;
        }

        return `
            <li class="process-item">
                <span class="ok">✓</span>
                <span>
                    <strong>P${item.process}</strong>
                    (${item.size} KB) — Block ${item.block}<br>
                    ${item.remaining} KB remaining in block
                </span>
            </li>
        `;
    }).join("");
}

function createCard(blocks, result, type) {
    const rateClass = result.rate === 100
        ? "rate"
        : "rate partial";

    return `
        <article class="result-card ${type}">
            <header class="result-header ${type}">
                <h3>${result.algorithm}</h3>
                <p>Memory allocation performance</p>
                <span class="${rateClass}">
                    ${result.rate}% allocation success
                </span>
            </header>

            <div class="card-metrics">
                <div>
                    <span>Processes allocated</span>
                    <strong>${result.allocatedCount}/${result.processCount}</strong>
                </div>
                <div>
                    <span>Memory used</span>
                    <strong>${result.usedMemory} KB</strong>
                </div>
                <div>
                    <span>Memory remaining</span>
                    <strong>${result.freeMemory} KB</strong>
                </div>
                <div>
                    <span>Search checks</span>
                    <strong>${result.checks}</strong>
                </div>
            </div>

            <div class="block-section">
                <h4>MEMORY BLOCKS</h4>
                ${createBlockRows(blocks, result)}
            </div>

            <div class="process-section">
                <h4>PROCESS ALLOCATION</h4>
                <ul style="list-style:none">
                    ${createProcessRows(result)}
                </ul>
            </div>
        </article>
    `;
}

function runSimulation() {
    errorMessage.textContent = "";
    results.innerHTML = "";

    try {
        const blocks = readSizes(
            blocksInput.value, "Memory blocks"
        );

        const processes = readSizes(
            processesInput.value, "Processes"
        );

        document.getElementById("totalMemory").textContent =
            blocks.reduce((sum, size) => sum + size, 0) + " KB";

        document.getElementById("totalProcesses").textContent =
            processes.length;

        const configurations = [
            { name: "First Fit", type: "first" },
            { name: "Best Fit", type: "best" },
            { name: "Worst Fit", type: "worst" }
        ];

        results.innerHTML = configurations.map(config => {
            const result = allocateMemory(
                blocks, processes, config.name
            );

            return createCard(blocks, result, config.type);
        }).join("");

    } catch (error) {
        errorMessage.textContent = error.message;

        document.getElementById("totalMemory").textContent = "—";
        document.getElementById("totalProcesses").textContent = "—";
    }
}

document.getElementById("runBtn").addEventListener(
    "click", runSimulation
);

document.getElementById("resetBtn").addEventListener("click", () => {
    blocksInput.value = DEFAULT_BLOCKS;
    processesInput.value = DEFAULT_PROCESSES;
    runSimulation();
});

[blocksInput, processesInput].forEach(input => {
    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            runSimulation();
        }
    });
});

runSimulation();
