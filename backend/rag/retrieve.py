import logging

logger = logging.getLogger(__name__)


def retrieve_standards(query: str, index, k: int = 3) -> list:
    """
    Retrieve relevant quality standards for a query.

    This is a wrapper around the StandardsIndex.retrieve() method
    for convenient use in the inspection pipeline.

    Args:
        query: Query string (e.g., detected defect label)
        index: StandardsIndex instance
        k: Number of standards to retrieve

    Returns:
        List of relevant standards, or empty list if error
    """
    if index is None:
        logger.warning("Standards index not available")
        return []

    try:
        results = index.retrieve(query, k=k)
        logger.info(f"Retrieved {len(results)} standards for query: {query}")
        return results
    except Exception as e:
        logger.error(f"Error retrieving standards: {e}")
        return []
