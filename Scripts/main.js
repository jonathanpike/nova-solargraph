var langserver = null;

exports.activate = function () {
  // Do work when the extension is activated
  langserver = new RubyLanguageServer();
};

exports.deactivate = function () {
  // Clean up state before the extension is deactivated
  if (langserver) {
    langserver.deactivate();
    langserver = null;
  }
};

class RubyLanguageServer {
  constructor() {
    // Observe the configuration setting for the server's location, and restart the server on change
    nova.config.observe(
      "rubySolargraph.language-server-path",
      function (path) {
        this.start(path);
      },
      this
    );
  }

  deactivate() {
    this.stop();
  }

  start(path) {
    if (this.languageClient) {
      this.languageClient.stop();
      nova.subscriptions.remove(this.languageClient);
    }

    // Use the default server path
    if (!path) {
      path = "/usr/bin/env";
    }

    var rubyVersion = nova.config.get("rubySolargraph.ruby-version");
    if (!rubyVersion) {
      rubyVersion = "2.6.5";
    }

    // Create the client
    var serverOptions = {
      path: path,
      args: ["solargraph", "stdio"],
      type: "stdio",
      env: {
        RBENV_VERSION: rubyVersion,
      },
    };
    var clientOptions = {
      // The set of document syntaxes for which the server is valid
      syntaxes: ["ruby"],
    };
    var client = new LanguageClient(
      "ruby-solargraph",
      "Ruby Solargraph Language Server",
      serverOptions,
      clientOptions
    );

    try {
      // Start the client
      client.start();

      // Add the client to the subscriptions to be cleaned up
      nova.subscriptions.add(client);
      this.languageClient = client;
    } catch (err) {
      // If the .start() method throws, it's likely because the path to the language server is invalid

      if (nova.inDevMode()) {
        console.error(err);
      }
    }
  }

  stop() {
    if (this.languageClient) {
      this.languageClient.stop();
      nova.subscriptions.remove(this.languageClient);
      this.languageClient = null;
    }
  }
}
