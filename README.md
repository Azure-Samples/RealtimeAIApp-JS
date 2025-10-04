# Realtime AI App - Language Coach and Medical Form Assistant

This project demonstrates how to build a real-time AI application using the Azure OpenAI Realtime API. The demo app features a language coach and a medical form assistant. The language coach allows users to practice speaking a language and get instant feedback on their pronunciation, while the medical form assistant helps users fill out medical forms by conversing with them using their voice.

- [View Repo Adventure Walkthrough](https://azure-samples.github.io/RealtimeAIApp-JS/)

**Language Coach**

![Language Coach Screenshot](images/language-coach.png)

**Medical Form Assistant**

![Medical Form Assistant Screenshot](images/medical-form.png)

## Getting Started

1. Clone the project.
2. Create a `gpt-realtime` model deployment in [Azure AI Foundry](https://ai.azure.com).
3. Rename `.env.example` to `.env` in the root of the project.
4. Add your `gpt-realtime` endpoint to `OPENAI_ENDPOINT` and your key to `OPENAI_API_KEY`. You can get those values from Azure AI Foundry.

  ```
  OPENAI_API_KEY=
  OPENAI_MODEL=gpt-realtime
  OPENAI_ENDPOINT=
  OPENAI_API_VERSION=2025-04-01-preview
  BACKEND=azure
  ```

> Note: If you'd like to use OpenAI instead of Azure OpenAI, add your OpenAI API key to `OPENAI_API_KEY` and leave the `OPENAI_ENDPOINT` blank. Remove the value for `BACKEND`.

4. Run `npm install` in the `client` and `server` directories.
5. Run `npm run dev` in the `server` directory.
6. Run `npm start` in the `client` directory.
7. Click the `Connect` button in the browser to get started, allow your microphone to be accessed, and start speaking.
8. Click the `Disconnect` button to stop the session.
## Keyless Approach

If you'd like to use the more secure "keyless" approach with Azure OpenAI, run the following command to add the *OpenAI Contributor* role to your user principal. Install the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) if you don't have it on your machine already.

```
az role assignment create \
  --role "Cognitive Services OpenAI Contributor" \
  --assignee-object-id "<USER_PRINCIPAL_ID>" \
  --scope "/subscriptions/<SUBSCRIPTION_ID>/resourceGroups/<RESOURCE_GROUP>" \
  --assignee-principal-type User
```

Add your *subscription ID*, *resource group*, and user *principal ID* (assigness-object-id) to the command above. 
- Run `az login` and select your target subscription.
- Get your subscription ID by running `az account list --query "[?isDefault].id" -o tsv`.
- Find your user principal ID by running `az ad signed-in-user show --query objectId -o tsv` or `az rest --method GET --url "https://graph.microsoft.com/v1.0/me" --query "id"`.

You can then remove the `OPENAI_API_KEY` value your `.env` file.


## Architecture Overview

The following diagram illustrates the WebSocket communication flow in the `RTSession` class, showing how client messages are processed and relayed to the OpenAI Realtime API.

- **Client**: This is you—the user interacting with the app via your browser. It sends audio or text inputs (like saying “Hello” or typing a question) to kick things off. It’s written using Angular.
-  **RealTime Session**: The Node.js code where the main action takes place – it manages the flow. It uses a client WebSocket to receive your inputs and send back responses, while a RealTime AI WebSocket connects to the OpenAI API. The logic block processes messages, ensuring everything runs smoothly between the client and the AI.
-  **OpenAI RealTime API**: This is the brains of the operation. It receives audio/text from the Realtime Session, processes it with the gpt-4o-realtime model, and sends back audio/text responses. The app supports calling OpenAI or Azure OpenAI.

```mermaid
%%{init: {'flowchart': {'nodeSpacing': 50, 'rankSpacing': 75}}}%%
graph TD
    A[Client] -->|Sends audio/text| B[Client WebSocket]
    subgraph Realtime_Session["Realtime Session"]
        B[Client WebSocket]
        C[Logic]
        D[Realtime AI WebSocket]
    end
    E[OpenAI Realtime API]

    B <-->|Receives responses| C
    C <-->|Processes messages| D
    D <-->|Sends audio/text to Azure OpenAI| E
    E -->|Sends audio/text responses| D

    classDef sessionLabel font-size:20px;
    class Realtime_Session sessionLabel

    style A fill:#f9f,stroke:#333,stroke-width:2px,font-size:20px;
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#dfd,stroke:#333,stroke-width:2px
    style D fill:#bbf,stroke:#333,stroke-width:2px
    style E fill:#f9f,stroke:#333,stroke-width:2px
```

## Acknowledgements

Thanks to [Steve Sanderson](https://github.com/SteveSandersonMS) for the initial inspiration for this demo.

## Getting Help

If you get stuck or have any questions about building AI apps, join:

[![Azure AI Foundry Discord](https://img.shields.io/badge/Discord-Azure_AI_Foundry_Community_Discord-blue?style=for-the-badge&logo=discord&color=5865f2&logoColor=fff)](https://aka.ms/foundry/discord)

If you have product feedback or errors while building visit:

[![Azure AI Foundry Developer Forum](https://img.shields.io/badge/GitHub-Azure_AI_Foundry_Developer_Forum-blue?style=for-the-badge&logo=github&color=000000&logoColor=fff)](https://aka.ms/foundry/forum)