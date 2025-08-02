import './index.css';
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CampProvider } from "@campnetwork/origin/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

const queryClient = new QueryClient();

const apollo = new ApolloClient({
  uri: import.meta.env.VITE_SUBGRAPH_URL,
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CampProvider clientId={import.meta.env.VITE_ORIGIN_CLIENT_ID}>
        <ApolloProvider client={apollo}>
          <App />
        </ApolloProvider>
      </CampProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
