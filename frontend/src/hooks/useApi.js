import { useState, useCallback, useEffect } from "react";

/**
 * A simple hook to replace query functionality
 * @param {Object} options 
 * @returns {Object} { data, isLoading, isError, error, refetch }
 */
export const useApiQuery = (queryKey, queryFn, options = {}) => {
  const [data, setData] = useState(options.initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const result = await queryFn();
      setData(result);
    } catch (err) {
      setIsError(true);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(queryKey)]); // Re-fetch if queryKey changes

  useEffect(() => {
    if (options.enabled !== false) {
      fetchData();
    }
  }, [fetchData, options.enabled]);

  return { data, isLoading, isError, error, refetch: fetchData };
};

/**
 * A simple hook to replace mutation functionality
 * @param {Object} options 
 * @returns {Object} { mutate, isPending, isError, error }
 */
export const useApiMutation = ({ mutationFn, onSuccess, onError }) => {
  const [isPending, setIsPending] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (variables) => {
    setIsPending(true);
    setIsError(false);
    try {
      const result = await mutationFn(variables);
      if (onSuccess) onSuccess(result);
      return result;
    } catch (err) {
      setIsError(true);
      setError(err);
      if (onError) onError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending, isError, error };
};
