migrate((app) => {
  const collection = new Collection({
    "id": "challenges_coll",
    "name": "challenges",
    "type": "base",
    "system": false,
    "fields": [
      {
        "id": "title_field",
        "name": "title",
        "type": "text",
        "required": true,
        "presentable": true
      },
      {
        "id": "difficulty_field",
        "name": "difficulty",
        "type": "text",
        "required": true
      },
      {
        "id": "type_field",
        "name": "type",
        "type": "text",
        "required": true
      },
      {
        "id": "duration_field",
        "name": "duration",
        "type": "number"
      },
      {
        "id": "topics_field",
        "name": "topics",
        "type": "json"
      },
      {
        "id": "companies_field",
        "name": "companies",
        "type": "json"
      },
      {
        "id": "description_field",
        "name": "description",
        "type": "text"
      },
      {
        "id": "changes_field",
        "name": "changesToBeDone",
        "type": "json"
      },
      {
        "id": "hints_field",
        "name": "hints",
        "type": "json"
      },
      {
        "id": "rules_field",
        "name": "rules",
        "type": "json"
      },
      {
        "id": "html_field",
        "name": "initialHtml",
        "type": "text"
      },
      {
        "id": "css_field",
        "name": "initialCss",
        "type": "text"
      },
      {
        "id": "js_field",
        "name": "initialJs",
        "type": "text"
      },
      {
        "id": "sol_html_field",
        "name": "solutionHtml",
        "type": "text"
      },
      {
        "id": "sol_css_field",
        "name": "solutionCss",
        "type": "text"
      },
      {
        "id": "sol_js_field",
        "name": "solutionJs",
        "type": "text"
      },
      {
        "id": "env_field",
        "name": "env",
        "type": "text"
      }
    ],
    "indexes": [],
    "listRule": "",
    "viewRule": "",
    "createRule": "",
    "updateRule": "",
    "deleteRule": "",
    "options": {}
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("challenges_coll");

  return app.delete(collection);
});
