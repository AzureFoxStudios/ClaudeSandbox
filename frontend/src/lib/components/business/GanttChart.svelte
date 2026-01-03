<script lang="ts">
	import { projects, sprints, todos } from '$lib/business/store';
	import type { Project, Sprint, Todo } from '$lib/business/types';

	export let selectedProjectId: string | null = null;

	// Get the selected project or all projects
	$: displayProjects = selectedProjectId
		? $projects.filter(p => p.id === selectedProjectId)
		: $projects.filter(p => !p.parentId); // Root projects only

	// Calculate timeline bounds
	$: {
		const allDates = displayProjects.flatMap(p => [
			p.startDate || p.createdAt,
			p.targetEndDate || Date.now()
		]);
		minDate = Math.min(...allDates);
		maxDate = Math.max(...allDates);
	}

	let minDate: number;
	let maxDate: number;
	const PIXELS_PER_DAY = 3;
	const ROW_HEIGHT = 40;

	// Format date for display
	function formatDate(timestamp: number): string {
		return new Date(timestamp).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	// Calculate bar position and width
	function calculateBar(startDate: number | undefined, endDate: number | undefined) {
		const start = startDate || minDate;
		const end = endDate || maxDate;
		const left = ((start - minDate) / (maxDate - minDate)) * 100;
		const width = Math.max(2, ((end - start) / (maxDate - minDate)) * 100);
		return { left, width };
	}

	// Get progress color
	function getProgressColor(project: Project): string {
		const projectTodos = $todos.filter(t => t.projectId === project.id);
		if (projectTodos.length === 0) return '#8b5cf6';
		const completed = projectTodos.filter(t => t.status === 'done').length;
		const progress = (completed / projectTodos.length) * 100;

		if (progress === 100) return '#10b981';
		if (progress >= 75) return '#3b82f6';
		if (progress >= 50) return '#f59e0b';
		return '#ef4444';
	}

	// Get sprints for a project
	function getSprintsForProject(projectId: string): Sprint[] {
		return $sprints.filter(s => s.projectId === projectId);
	}

	// Calculate progress percentage
	function getProgress(projectId: string): number {
		const projectTodos = $todos.filter(t => t.projectId === projectId);
		if (projectTodos.length === 0) return 0;
		const completed = projectTodos.filter(t => t.status === 'done').length;
		return Math.round((completed / projectTodos.length) * 100);
	}
</script>

<div class="gantt-container">
	<div class="gantt-header">
		<h2>Project Timeline {selectedProjectId ? '(Gantt)' : '(All Projects)'}</h2>
		<p class="gantt-info">
			Drag bars to see project deadlines. Green = Complete, Blue = On Track, Amber = Behind
		</p>
	</div>

	{#if displayProjects.length === 0}
		<div class="empty-state">
			<p>No projects to display</p>
		</div>
	{:else}
		<div class="gantt-chart" style="--pixels-per-day: {PIXELS_PER_DAY}px;">
			<!-- Timeline header -->
			<div class="gantt-timeline-header">
				<div class="gantt-labels"></div>
				<div class="gantt-bars">
					<div class="timeline-months">
						{#each Array.from({ length: 13 }) as _, i}
							{@const date = new Date(minDate)}
							{@const monthDate = new Date(date.getFullYear(), date.getMonth() + i, 1)}
							<div class="month-label">
								{monthDate.toLocaleDateString('en-US', {
									month: 'short',
									year: monthDate.getMonth() === 0 ? '2-digit' : undefined
								})}
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Project rows -->
			{#each displayProjects as project (project.id)}
				<div class="gantt-row">
					<div class="gantt-label">
						<div class="project-title">{project.name}</div>
						<div class="project-meta">
							{getProgress(project.id)}% • {$todos.filter(t => t.projectId === project.id).length} tasks
						</div>
					</div>

					<div class="gantt-bars">
						<!-- Main project bar -->
						<div
							class="gantt-bar-container"
							style="left: {calculateBar(project.startDate, project.targetEndDate).left}%;
                                   width: {calculateBar(project.startDate, project.targetEndDate).width}%"
						>
							<div
								class="gantt-bar"
								class:complete={getProgress(project.id) === 100}
								style="background-color: {getProgressColor(project)}"
								title="{formatDate(project.startDate || project.createdAt)} → {formatDate(
									project.targetEndDate || Date.now()
								)}"
							>
								<span class="progress-label">{getProgress(project.id)}%</span>
							</div>
						</div>

						<!-- Sprint markers -->
						{#each getSprintsForProject(project.id) as sprint}
							<div
								class="sprint-marker"
								style="left: {calculateBar(sprint.startDate, sprint.endDate).left}%"
								title="Sprint: {sprint.name}"
							></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.gantt-container {
		padding: 1rem;
		background: var(--biz-bg-secondary, #1a2332);
		border-radius: 8px;
		overflow: hidden;
	}

	.gantt-header {
		margin-bottom: 1.5rem;
	}

	.gantt-header h2 {
		margin: 0 0 0.5rem 0;
		color: var(--biz-text-primary, #f1f5f9);
		font-size: 1.25rem;
	}

	.gantt-info {
		margin: 0;
		color: var(--biz-text-secondary, #94a3b8);
		font-size: 0.875rem;
	}

	.empty-state {
		padding: 2rem;
		text-align: center;
		color: var(--biz-text-secondary, #94a3b8);
	}

	.gantt-chart {
		display: flex;
		flex-direction: column;
		gap: 0;
		overflow-x: auto;
		border: 1px solid var(--biz-border, #2d3a4d);
		border-radius: 4px;
	}

	.gantt-timeline-header {
		display: flex;
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--biz-bg-tertiary, #243044);
		border-bottom: 2px solid var(--biz-border, #2d3a4d);
	}

	.gantt-labels {
		min-width: 180px;
		flex-shrink: 0;
	}

	.gantt-bars {
		flex: 1;
		position: relative;
	}

	.timeline-months {
		display: flex;
		height: 3rem;
		border-left: 1px solid var(--biz-border, #2d3a4d);
	}

	.month-label {
		flex: 1;
		min-width: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--biz-text-secondary, #94a3b8);
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		border-right: 1px solid var(--biz-border, #2d3a4d);
		padding: 0 0.5rem;
	}

	.gantt-row {
		display: flex;
		border-bottom: 1px solid var(--biz-border, #2d3a4d);
		min-height: var(--row-height, 80px);
		background: var(--biz-bg-secondary, #1a2332);
	}

	.gantt-row:hover {
		background: var(--biz-bg-tertiary, #243044);
	}

	.gantt-label {
		min-width: 180px;
		flex-shrink: 0;
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 0.25rem;
		border-right: 1px solid var(--biz-border, #2d3a4d);
	}

	.project-title {
		color: var(--biz-text-primary, #f1f5f9);
		font-weight: 600;
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.project-meta {
		color: var(--biz-text-secondary, #94a3b8);
		font-size: 0.75rem;
	}

	.gantt-bars {
		flex: 1;
		position: relative;
		display: flex;
		align-items: center;
	}

	.gantt-bar-container {
		position: absolute;
		height: 24px;
		display: flex;
		align-items: center;
	}

	.gantt-bar {
		width: 100%;
		height: 100%;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
		border: 1px solid rgba(255, 255, 255, 0.2);
		position: relative;
		overflow: hidden;
	}

	.gantt-bar:hover {
		box-shadow: 0 0 12px rgba(0, 0, 0, 0.5);
		transform: scaleY(1.3);
	}

	.gantt-bar.complete::after {
		content: '✓';
		position: absolute;
		right: 4px;
		color: white;
		font-weight: bold;
		font-size: 0.75rem;
	}

	.progress-label {
		color: white;
		font-size: 0.7rem;
		font-weight: 600;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.sprint-marker {
		position: absolute;
		width: 2px;
		height: 100%;
		background: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		top: -12px;
	}

	.sprint-marker:hover {
		background: white;
		z-index: 5;
	}

	@media (max-width: 768px) {
		.gantt-label {
			min-width: 120px;
		}

		.project-title {
			font-size: 0.85rem;
		}

		.month-label {
			min-width: 80px;
			font-size: 0.65rem;
		}
	}
</style>
