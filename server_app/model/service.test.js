// Arquivo: server_app/model/service.test.js

const modelService = require("./service");
const modelRepository = require("./model");

jest.mock("./model", () => ({
    findOne: jest.fn(),
}));


const mockBuildSharedModelResponse = (model) => ({
    id: model.shareOptions._id,
    model: model.model,
    type: model.type,
    name: model.name,
    importAllowed: model.shareOptions.importAllowed || false,
});

describe("modelService.findSharedModel", () => {
    const sharedId = "valid-shared-id";
    const mockModel = (shareOptions) => ({
        _id: "model-id",
        name: "Test Model",
        shareOptions: shareOptions,
        model: { nodes: [], edges: [] },
        type: "conceptual",
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // CT1: Deve resolver a promessa quando o modelo é compartilhado e ativo (V, V, V)
    test("CT1: Deve resolver a promessa quando o modelo é compartilhado e ativo", async () => {
        const activeShareOptions = {
            _id: "share-id-1",
            active: true,
            importAllowed: true,
        };
        const model = mockModel(activeShareOptions);
        modelRepository.findOne.mockResolvedValue(model);

        await expect(modelService.findSharedModel(sharedId)).resolves.toEqual(
            mockBuildSharedModelResponse(model)
        );
        // Verifica se o findOne foi chamado com o sharedId correto
        expect(modelRepository.findOne).toHaveBeenCalledWith({
            "shareOptions._id": sharedId,
        });
    });

    // CT2: Deve rejeitar a promessa quando o compartilhamento está inativo (V, V, F)
    test("CT2: Deve rejeitar a promessa quando o compartilhamento está inativo (active: false)", async () => {
        const inactiveShareOptions = {
            _id: "share-id-2",
            active: false,
            importAllowed: true,
        };
        const model = mockModel(inactiveShareOptions);
        modelRepository.findOne.mockResolvedValue(model);

        await expect(modelService.findSharedModel(sharedId)).rejects.toBe(
            "unauthorized"
        );
    });

    // CT3: Deve rejeitar a promessa quando shareOptions é nulo (V, F, X)
    test("CT3: Deve rejeitar a promessa quando shareOptions é null", async () => {
        const model = mockModel(null);
        modelRepository.findOne.mockResolvedValue(model);

        await expect(modelService.findSharedModel(sharedId)).rejects.toBe(
            "unauthorized"
        );
    });

    // CT4: Deve rejeitar a promessa quando o modelo não é encontrado (F, X, X)
    test("CT4: Deve rejeitar a promessa quando o modelo não é encontrado (retorna null)", async () => {
        modelRepository.findOne.mockResolvedValue(null);

        await expect(modelService.findSharedModel(sharedId)).rejects.toBe(
            "unauthorized"
        );
    });

    // CT5: Deve rejeitar a promessa em caso de erro na consulta ao repositório (Tratamento de Exceção)
    test("CT5: Deve rejeitar a promessa em caso de erro de consulta ao banco de dados", async () => {
        const mockError = new Error("Database connection failed");
        modelRepository.findOne.mockRejectedValue(mockError);

        // O método findSharedModel deve rejeitar com o próprio objeto de erro
        await expect(modelService.findSharedModel(sharedId)).rejects.toBe(mockError);
    });
});
