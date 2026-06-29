import serverless from "serverless-http";

let cachedHandler;

function getErrorMessage(error) {
	if (error instanceof Error && typeof error.message === "string") {
		return error.message;
	}

	return "Server startup failed.";
}

function withStartupHint(message) {
	if (message.includes("OPENAI_API_KEY is required")) {
		return "OPENAI_API_KEY mangler i Netlify Environment Variables.";
	}

	if (message.includes("OPENAI_MODEL")) {
		return "OPENAI_MODEL mangler eller er ugyldig i Netlify Environment Variables.";
	}

	return message;
}

async function getHandler() {
	if (cachedHandler) {
		return cachedHandler;
	}

	const { createApp } = await import("../../src/index.js");
	cachedHandler = serverless(createApp(), {
		basePath: "/.netlify/functions/api"
	});
	return cachedHandler;
}

export async function handler(event, context) {
	try {
		const runtimeHandler = await getHandler();
		return await runtimeHandler(event, context);
	} catch (error) {
		const message = withStartupHint(getErrorMessage(error));

		return {
			statusCode: 500,
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				error: "ServerStartupError",
				code: "server_startup_failed",
				message
			})
		};
	}
}
