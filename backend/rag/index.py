import faiss
import logging
from sentence_transformers import SentenceTransformer
import numpy as np

logger = logging.getLogger(__name__)


class StandardsIndex:
    """
    FAISS-based vector index for quality standards retrieval.

    Loads quality standards from a text corpus, embeds them using Sentence-BERT,
    and builds a FAISS index for efficient semantic search.
    """

    def __init__(self, corpus_path: str, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the standards index.

        Args:
            corpus_path: Path to the standards corpus file
            model_name: Sentence-BERT model name to use for embeddings
        """
        self.corpus_path = corpus_path
        self.model_name = model_name

        # Load standards from file
        try:
            self.standards = self._load_standards(corpus_path)
            logger.info(f"Loaded {len(self.standards)} standards from {corpus_path}")
        except Exception as e:
            logger.error(f"Failed to load standards: {e}")
            self.standards = []

        # Load embedding model
        try:
            self.model = SentenceTransformer(model_name)
            logger.info(f"Loaded embedding model: {model_name}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise

        # Build FAISS index
        try:
            self.index = self._build_index()
            logger.info(f"Built FAISS index with {self.index.ntotal} vectors")
        except Exception as e:
            logger.error(f"Failed to build FAISS index: {e}")
            self.index = None

    def _load_standards(self, path: str) -> list:
        """
        Load standards from a pipe-delimited text file.

        Expected format:
        source: Source Name | clause_id: 1.2.3 | Standard text here.

        Args:
            path: Path to standards corpus file

        Returns:
            List of dicts with keys: source, clause_id, text
        """
        standards = []
        try:
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue

                    try:
                        parts = line.split(" | ")
                        if len(parts) >= 3:
                            source = parts[0].split(": ", 1)[1] if ": " in parts[0] else parts[0]
                            clause_id = parts[1].split(": ", 1)[1] if ": " in parts[1] else parts[1]
                            text = parts[2].split(": ", 1)[1] if ": " in parts[2] else parts[2]

                            standards.append({
                                "source": source,
                                "clause_id": clause_id,
                                "text": text
                            })
                    except Exception as e:
                        logger.warning(f"Failed to parse line: {line}. Error: {e}")
                        continue

        except FileNotFoundError:
            logger.error(f"Standards file not found: {path}")
            raise

        return standards

    def _build_index(self) -> faiss.IndexFlatL2:
        """
        Build FAISS index from standards.

        Returns:
            FAISS flat L2 index
        """
        if not self.standards:
            logger.warning("No standards to build index from")
            return None

        # Extract texts and embed
        texts = [s["text"] for s in self.standards]
        logger.info(f"Embedding {len(texts)} standards...")

        embeddings = self.model.encode(texts, show_progress_bar=False)
        embeddings = np.array(embeddings).astype("float32")

        # Create FAISS index
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(embeddings)

        return index

    def retrieve(self, query: str, k: int = 3) -> list:
        """
        Retrieve top-k standards most similar to the query.

        Args:
            query: Query string (e.g., defect label)
            k: Number of results to return

        Returns:
            List of dicts with keys: source, clause_id, text, distance
        """
        if not self.index or not self.standards:
            logger.warning("Index not available or empty")
            return []

        try:
            # Embed query
            query_embedding = self.model.encode([query], show_progress_bar=False)
            query_embedding = np.array(query_embedding).astype("float32")

            # Search index
            distances, indices = self.index.search(query_embedding, k)

            # Build results
            results = []
            for i, idx in enumerate(indices[0]):
                if 0 <= idx < len(self.standards):
                    result = self.standards[idx].copy()
                    result["distance"] = float(distances[0][i])
                    results.append(result)

            return results

        except Exception as e:
            logger.error(f"Error during retrieval: {e}")
            return []
