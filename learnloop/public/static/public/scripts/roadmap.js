import { getCookie } from './utils.js';

let statusChart = null;
let priorityChart = null;

function renderStatusChart(chartData) {
    const ctx = document.getElementById('status-chart')?.getContext('2d');
    if (!ctx) return;

    if (statusChart) {
        statusChart.destroy();
    }

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: ['#6c757d', '#007bff', '#28a745', '#ffc107'], // Cores para Backlog, ToDo, In Progress, Complete
                borderColor: '#f0f2f5',
                borderWidth: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: {
                            family: "'Inter', sans-serif",
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function renderPriorityChart(chartData) {
    const ctx = document.getElementById('priority-chart')?.getContext('2d');
    if (!ctx) return;

    if (priorityChart) {
        priorityChart.destroy();
    }

    priorityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.data,
                backgroundColor: chartData.colors,
                borderColor: '#f0f2f5',
                borderWidth: 4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: {
                            family: "'Inter', sans-serif",
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += context.parsed;
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

function getTextColorForBg(hexColor) {
    if (!hexColor) return '#000000';
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

function renderTasksTable(tasks) {
    const tbody = document.getElementById('roadmap-tasks-tbody');
    if (!tbody) return;

    tbody.innerHTML = ''; // Limpa a tabela

    if (tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma tarefa encontrada.</td></tr>';
        return;
    }

    tasks.forEach(task => {
        const responsaveisHtml = task.responsaveis.map(r =>
            `<img src="/static/${r.avatar}" alt="${r.nome_completo}" class="avatar-sm" title="${r.nome_completo}">`
        ).join('');

        const prioridadeCorTexto = getTextColorForBg(task.prioridade?.cor);
        const tamanhoCorTexto = getTextColorForBg(task.tamanho?.cor);

        const row = `
            <tr>
                <td><span class="status-tag-table" style="background-color: #ccc;">${task.status}</span></td>
                <td class="task-title-cell">${task.titulo}</td>
                <td>${task.prioridade ? `<span class="priority-tag-table" style="background-color:${task.prioridade.cor}; color: ${prioridadeCorTexto};">${task.prioridade.nome}</span>` : 'N/A'}</td>
                <td>${task.tamanho ? `<span class="size-tag-table" style="background-color:${task.tamanho.cor}; color: ${tamanhoCorTexto};">${task.tamanho.nome}</span>` : 'N/A'}</td>
                <td class="avatars-cell">${responsaveisHtml || 'N/A'}</td>
                <td>${task.milestone}</td>
                <td>${task.sprint}</td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}


async function loadRoadmapData() {
    if (!window.GET_ROADMAP_DATA_URL) {
        console.error("URL de dados do Roadmap não definida.");
        return;
    }

    try {
        const response = await fetch(window.GET_ROADMAP_DATA_URL);
        if (!response.ok) {
            throw new Error('Falha ao carregar os dados do roadmap.');
        }
        const result = await response.json();

        if (result.status === 'success') {
            renderTasksTable(result.tasks);
            renderStatusChart(result.charts.status);
            renderPriorityChart(result.charts.priority);
        } else {
            console.error("Erro ao buscar dados do roadmap:", result.message);
        }
    } catch (error) {
        console.error("Erro na requisição do roadmap:", error);
    }
}

export function setupRoadmapTab() {
    const roadmapTab = document.querySelector('.tab[data-tab="roadmap"]');
    if (roadmapTab) {
        // Usamos um observer para carregar os dados apenas quando a aba se tornar visível
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && roadmapTab.classList.contains('active')) {
                    const contentRoadmap = document.getElementById('content-roadmap');
                    if(contentRoadmap && contentRoadmap.classList.contains('active-content')){
                        loadRoadmapData();
                    }
                }
            });
        });

        const contentRoadmap = document.getElementById('content-roadmap');
        if(contentRoadmap){
             observer.observe(contentRoadmap, { attributes: true });
        }

        // Carga inicial se a aba já estiver ativa
        if (contentRoadmap && contentRoadmap.classList.contains('active-content')) {
            loadRoadmapData();
        }
    }
}