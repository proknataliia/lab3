const abuseCount = document.getElementById("abuseCount");
const abuseError = document.getElementById("abuseError");
const summary = document.getElementById("summary");
const log = document.getElementById("log");
const buttons = [...document.querySelectorAll("button")];

document.getElementById("abuseVulnerableBtn").addEventListener("click", () => {
	runAbuse("/api/security/abuse/vulnerable", "API Abuse vulnerable endpoint");
});

document.getElementById("abuseProtectedBtn").addEventListener("click", () => {
	runAbuse("/api/security/abuse/protected", "API Abuse protected endpoint");
});

document.getElementById("resetAbuseBtn").addEventListener("click", resetAbuse);

document.getElementById("corsVulnerableBtn").addEventListener("click", () => {
	runCorsAttack("/api/security/cors/vulnerable/profile", "CORS vulnerable profile");
});

document.getElementById("corsProtectedBtn").addEventListener("click", () => {
	runCorsAttack("/api/security/cors/protected/profile", "CORS protected profile");
});

abuseCount.addEventListener("input", validateCount);

function validateCount() {
	const value = Number(abuseCount.value);

	if (!Number.isInteger(value) || value < 1 || value > 60) {
		abuseCount.classList.add("invalid");
		abuseError.textContent = "Введіть ціле число від 1 до 60.";
		return 0;
	}

	abuseCount.classList.remove("invalid");
	abuseError.textContent = "";
	return value;
}

async function runAbuse(url, title) {
	const count = validateCount();
	if (!count) {
		setSummary("Виправте кількість запитів перед запуском.");
		return;
	}

	setBusy(true);
	setSummary(`${title}: надсилаємо ${count} паралельних запитів...`);
	log.textContent = "";
	const started = performance.now();

	try {
		const results = await Promise.all(
			Array.from({ length: count }, (_, index) => callEndpoint(url, index + 1))
		);
		printAbuseResults(title, results, performance.now() - started);
	} finally {
		setBusy(false);
	}
}

async function callEndpoint(url, number) {
	try {
		const response = await fetch(url);
		const data = await response.json();

		return {
			number,
			status: response.status,
			body: data,
		};
	} catch (error) {
		return {
			number,
			status: "error",
			body: { error: error.message },
		};
	}
}

function printAbuseResults(title, results, duration) {
	const ok = results.filter((item) => item.status === 200).length;
	const blocked = results.filter((item) => item.status === 429).length;
	const failed = results.length - ok - blocked;

	setSummary(`${title}: OK ${ok}, blocked ${blocked}, errors ${failed}, time ${Math.round(duration)} ms.`);
	log.textContent = results
		.map((item) => {
			const message = item.body.error || item.body.message || "no message";
			return `#${item.number} -> ${item.status}: ${message}`;
		})
		.join("\n");
}

async function resetAbuse() {
	setBusy(true);

	try {
		const response = await fetch("/api/security/abuse/reset", { method: "POST" });
		const data = await response.json();
		setSummary(`HTTP ${response.status}: ${data.message || "Reset completed"}`);
		log.textContent = JSON.stringify(data, null, 2);
	} catch (error) {
		setSummary("Не вдалося скинути лічильники.");
		log.textContent = error.message;
	} finally {
		setBusy(false);
	}
}

function runCorsAttack(url, title) {
	setBusy(true);
	setSummary(`${title}: attacker iframe виконує cross-origin fetch...`);
	log.textContent = "";

	const frame = document.createElement("iframe");
	frame.setAttribute("sandbox", "allow-scripts");
	frame.hidden = true;

	const timeout = window.setTimeout(() => {
		frame.remove();
		setBusy(false);
		setSummary(`${title}: немає відповіді від attacker iframe.`);
	}, 5000);

	function onMessage(event) {
		if (!event.data || event.data.type !== "cors-demo") {
			return;
		}

		window.clearTimeout(timeout);
		window.removeEventListener("message", onMessage);
		frame.remove();
		setBusy(false);

		if (event.data.ok) {
			setSummary(`${title}: attacker зміг прочитати відповідь.`);
			log.textContent = JSON.stringify(event.data.data, null, 2);
			return;
		}

		setSummary(`${title}: браузер заблокував читання відповіді.`);
		log.textContent = event.data.error;
	}

	window.addEventListener("message", onMessage);
	frame.srcdoc = buildAttackerPage(url);
	document.body.appendChild(frame);
}

function buildAttackerPage(url) {
	return `
		<!doctype html>
		<html>
		<body>
		<script>
			fetch("${url}")
				.then((response) => response.json())
				.then((data) => {
					parent.postMessage({ type: "cors-demo", ok: true, data }, "*");
				})
				.catch((error) => {
					parent.postMessage({ type: "cors-demo", ok: false, error: error.message }, "*");
				});
		</script>
		</body>
		</html>
	`;
}

function setSummary(message) {
	summary.textContent = message;
}

function setBusy(isBusy) {
	buttons.forEach((button) => {
		button.disabled = isBusy;
	});
}
